-- Update the RPC function to check both metadata locations
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
  where au.raw_app_meta_data->>'stripe_customer_id' = p_stripe_customer_id
     or au.raw_user_meta_data->>'stripe_customer_id' = p_stripe_customer_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_by_stripe_customer_id(text) to authenticated;