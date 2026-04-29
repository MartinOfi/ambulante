-- B7.3: claim_auto_closeable_orders() — atomic SKIP LOCKED auto-close RPC.
-- PRD §7.6: ACEPTADO orders not closed within p_autoclose_hours → FINALIZADO.
-- PostgREST does not support FOR UPDATE SKIP LOCKED directly; this function
-- encapsulates the claim+update CTE so the route handler can call it via rpc().
-- Depends on: B1.2 (orders, users, stores tables), B7.2 (same pattern).

create or replace function public.claim_auto_closeable_orders(
  p_autoclose_hours integer default 2  -- mirrors ORDER_AUTOCLOSE_HOURS in shared/constants/order.ts
)
returns table (
  order_public_id  uuid,
  client_public_id uuid,
  store_public_id  uuid,
  sent_at          timestamptz,
  accepted_at      timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    select
      o.id,
      o.customer_id,
      o.store_id,
      o.created_at  as sent_at,
      -- CTE snapshot: updated_at is read here, before the UPDATE below fires, so the
    -- value is the pre-transition timestamp — exactly the proxy for accepted_at we need.
    o.updated_at  as accepted_at
    from public.orders o
    where o.status = 'aceptado'
      and o.updated_at < now() - make_interval(hours => p_autoclose_hours)
    order by o.updated_at
    for update skip locked
  ),
  updated as (
    update public.orders
       set status = 'finalizado'
       -- updated_at is managed by the trg_orders_updated_at trigger; no explicit set needed.
     where id in (select id from claimed)
     returning id, public_id
  )
  select
    u.public_id  as order_public_id,
    cu.public_id as client_public_id,
    st.public_id as store_public_id,
    c.sent_at,
    c.accepted_at
  from updated u
  join claimed        c  on  c.id = u.id
  join public.users  cu  on cu.id = c.customer_id
  join public.stores st  on st.id = c.store_id;
$$;

-- Only service_role (the route handler's Supabase client) may invoke this via PostgREST.
-- The CRON_SECRET check in the route handler is the primary auth layer; this provides
-- defense-in-depth so anon/authenticated callers cannot trigger batch auto-close.
revoke execute on function public.claim_auto_closeable_orders(integer) from public;
grant  execute on function public.claim_auto_closeable_orders(integer) to service_role;
