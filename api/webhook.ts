import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { handleStripeWebhook } from '../src/lib/stripe';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const config = {
  path: "/webhook"
};

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
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
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
      process.env.STRIPE_WEBHOOK_SECRET
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