import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError;
}

async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session?.customer || !session?.customer_email) return;

        // Get user by email
        const { data: users, error: userError } = await supabase.auth
          .admin.listUsers({
            filter: {
              email: session.customer_email
            }
          });

        if (userError || !users?.length) {
          console.error('Error finding user:', userError);
          return;
        }

        const userId = users[0].id;

        // Update subscription status with retry logic
        await retryOperation(async () => {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (subscriptionError) throw subscriptionError;
        });

        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer || customer.deleted || !customer.email) return;

        // Get user by email
        const { data: users, error: userError } = await supabase.auth
          .admin.listUsers({
            filter: {
              email: customer.email
            }
          });

        if (userError || !users?.length) {
          console.error('Error finding user:', userError);
          return;
        }

        const userId = users[0].id;
        const status = subscription.status === 'active' ? 'active' : 'inactive';

        // Update subscription status with retry logic
        await retryOperation(async () => {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              status,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (subscriptionError) throw subscriptionError;
        });

        break;
      }
    }
  } catch (err) {
    console.error('Error handling webhook:', err);
    throw err;
  }
}

export default async function handler(request: Request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        error: {
          message: 'Method not allowed. This endpoint only accepts POST requests.',
          type: 'invalid_request_error'
        }
      }), 
      { 
        status: 405,
        headers: {
          'Allow': 'POST',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Verify required environment variables
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return new Response(
      JSON.stringify({
        error: {
          message: 'Server configuration error',
          type: 'server_error'
        }
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response(
      JSON.stringify({ 
        error: {
          message: 'No Stripe signature found in request headers',
          type: 'invalid_request_error'
        }
      }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );

    await handleStripeWebhook(event);

    return new Response(
      JSON.stringify({ 
        received: true,
        type: event.type
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (err) {
    console.error('Webhook error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorType = err instanceof Stripe.errors.StripeSignatureVerificationError
      ? 'signature_verification_error'
      : 'webhook_error';

    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
          type: errorType
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      }
    );
  }
}