-- B7.2: claim_expirable_orders() — atomic SKIP LOCKED expiration RPC.
-- PostgREST does not support FOR UPDATE SKIP LOCKED directly; this function
-- encapsulates the claim+update CTE so the route handler can call it via rpc().
-- Depends on: B1.2 (orders, users, stores tables).

create or replace function public.claim_expirable_orders(
  p_expiration_minutes integer default 10  -- mirrors ORDER_EXPIRATION_MINUTES in shared/constants/order.ts
)
returns table (
  order_public_id  uuid,
  old_status       text,
  client_public_id uuid,
  store_public_id  uuid,
  sent_at          timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    select
      o.id,
      o.status::text   as old_status,
      o.customer_id,
      o.store_id,
      o.created_at     as sent_at
    from public.orders o
    where o.status in ('enviado', 'recibido')
      and o.created_at < now() - make_interval(mins => p_expiration_minutes)
    order by o.created_at
    for update skip locked
  ),
  updated as (
    update public.orders
       set status     = 'expirado',
           updated_at = now()
     where id in (select id from claimed)
     returning id, public_id
  )
  select
    u.public_id  as order_public_id,
    c.old_status,
    cu.public_id as client_public_id,
    st.public_id as store_public_id,
    c.sent_at
  from updated u
  join claimed        c  on  c.id = u.id
  join public.users  cu  on cu.id = c.customer_id
  join public.stores st  on st.id = c.store_id;
$$;

-- Only service_role (the route handler's Supabase client) may invoke this via PostgREST.
-- The CRON_SECRET check in the route handler is the primary auth layer; this provides
-- defense-in-depth so anon/authenticated callers cannot trigger batch expiration.
revoke execute on function public.claim_expirable_orders(integer) from public;
grant  execute on function public.claim_expirable_orders(integer) to service_role;
