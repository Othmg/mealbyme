/*
  # Add Stripe customer ID to subscriptions table

  1. Changes
    - Add `stripe_customer_id` column to `subscriptions` table
    - Add index on `stripe_customer_id` for faster lookups

  2. Notes
    - This column is needed for webhook processing
    - Adding an index improves query performance when looking up by customer ID
*/

-- Add stripe_customer_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN stripe_customer_id text;

    -- Create an index on stripe_customer_id
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
    ON subscriptions(stripe_customer_id);
  END IF;
END $$;