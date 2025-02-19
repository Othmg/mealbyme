/*
  # Add RPC function for Stripe customer lookup
  
  1. New Functions
    - `get_user_by_stripe_customer_id`: Securely queries auth.users table to find users by Stripe customer ID
  
  2. Security
    - Function is security definer to access auth schema
    - Execute permission granted to authenticated users only
    - Search path set to public for security
*/

-- Create the RPC function
create or replace function public.get_user_by_stripe_customer_id(p_stripe_customer_id text)
returns table (id uuid) 
security definer 
set search_path = public
language plpgsql
as $$
begin
  return query
  select au.id
  from auth.users au
  where au.raw_app_meta_data->>'stripe_customer_id' = p_stripe_customer_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_by_stripe_customer_id(text) to authenticated;