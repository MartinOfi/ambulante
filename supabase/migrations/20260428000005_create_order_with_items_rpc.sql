-- B3.1 — Atomic order creation RPC
-- Wraps the orders insert + order_items insert in a single PL/pgSQL function
-- so both writes share one implicit transaction. If items insert fails (e.g.
-- quantity constraint), Postgres rolls back the order row automatically.

create or replace function public.create_order_with_items(
  p_customer_id bigint,
  p_store_id    bigint,
  p_status      public.order_status,
  p_note        text,
  p_items       jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id  bigint;
  v_public_id uuid;
begin
  insert into public.orders (customer_id, store_id, status, customer_note)
  values (p_customer_id, p_store_id, p_status, p_note)
  returning id, public_id into v_order_id, v_public_id;

  insert into public.order_items (order_id, product_snapshot, quantity, unit_price)
  select
    v_order_id,
    jsonb_build_object(
      'productId',       item->>'productId',
      'productName',     item->>'productName',
      'productPriceArs', (item->>'productPriceArs')::numeric
    ),
    (item->>'quantity')::int,
    (item->>'productPriceArs')::numeric
  from jsonb_array_elements(p_items) as item;

  return v_public_id;
end;
$$;

-- Authenticated users (clients) call this to place orders.
-- Service role (route handlers) bypasses RLS and has implicit execute.
grant execute
  on function public.create_order_with_items(bigint, bigint, public.order_status, text, jsonb)
  to authenticated;
