import Stripe from 'stripe';
import { supabase } from './supabase';
import { handleDatabaseError, retryOperation } from './supabase';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function handleStripeWebhook(event: Stripe.Event) {
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
    const { error } = handleDatabaseError(err);
    console.error('Error handling webhook:', error);
    throw err;
  }
}