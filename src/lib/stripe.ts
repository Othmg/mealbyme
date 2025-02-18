import Stripe from 'stripe';
import { supabase } from './supabase';
import { handleDatabaseError, retryOperation } from './supabase';

// Remove client-side Stripe initialization
// Stripe operations should only be performed server-side

export async function handleStripeWebhook(event: Stripe.Event) {
  // This function should only be called from the server-side webhook handler
  throw new Error('Stripe webhook handler should only be called server-side');
}