-- NT-28: Add received_at to orders + update claim_expirable_orders RPC.
-- B7.2 used sent_at as a placeholder because this column didn't exist.
-- After this migration, received_at holds the exact timestamp when the order
-- transitioned to 'recibido'. The RPC returns it so route.ts can populate
-- OrderRecibido.receivedAt correctly.
--
-- NOTE: The expiration clock is intentionally anchored to created_at (= sent_at),
-- NOT to received_at. An order expires 10 min after it was sent, regardless of
-- when (or whether) the store received it. received_at is metadata for the audit
-- trail and state-machine reconstruction; it does not affect expiration logic.

-- ---------------------------------------------------------------------------
-- 1. Add received_at column (nullable — NULL for orders never received)
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists received_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Backfill: only rows currently in 'recibido' — the one status where
--    updated_at is a valid approximation of when the order was received.
--    For rows that advanced further (aceptado, en_camino, finalizado,
--    rechazado), updated_at reflects the latest transition, not the
--    recibido one, so those rows are left NULL to avoid planting wrong
--    timestamps. NULL is handled gracefully in the expiration route
--    (falls back to sent_at) and in future consumers ("unknown" is safer
--    than a silently incorrect value).
-- ---------------------------------------------------------------------------
update public.orders
set    received_at = updated_at
where  status::text = 'recibido'
  and  received_at is null;

-- ---------------------------------------------------------------------------
-- 3. Replace claim_expirable_orders to return received_at.
--    Rules applied: lock-skip-locked (FOR UPDATE SKIP LOCKED).
-- ---------------------------------------------------------------------------
create or replace function public.claim_expirable_orders(
  p_expiration_minutes integer default 10
)
returns table (
  order_public_id  uuid,
  old_status       text,
  client_public_id uuid,
  store_public_id  uuid,
  sent_at          timestamptz,
  received_at      timestamptz
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
      o.created_at     as sent_at,
      o.received_at
    from public.orders o
    where o.status in ('enviado', 'recibido')
      and o.created_at < now() - make_interval(mins => p_expiration_minutes)
    order by o.created_at
    for update skip locked
  ),
  updated as (
    update public.orders
       set status      = 'expirado',
           updated_at  = now()
     where id in (select id from claimed)
     returning id, public_id
  )
  select
    u.public_id  as order_public_id,
    c.old_status,
    cu.public_id as client_public_id,
    st.public_id as store_public_id,
    c.sent_at,
    c.received_at
  from updated u
  join claimed        c  on  c.id = u.id
  join public.users  cu  on cu.id = c.customer_id
  join public.stores st  on st.id = c.store_id;
$$;

revoke execute on function public.claim_expirable_orders(integer) from public;
grant  execute on function public.claim_expirable_orders(integer) to service_role;
