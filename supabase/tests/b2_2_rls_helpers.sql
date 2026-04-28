-- pgTAP test: B2.2 — RLS helper functions + orders_for_tienda view
-- Run with: pnpm supabase:test

begin;

-- ─── Test data setup ──────────────────────────────────────────────────────────
-- Inserting into auth.users fires the on_auth_user_created trigger which
-- creates the corresponding public.users rows automatically.
-- raw_user_meta_data.role sets the user_role; display_name falls back to the
-- email local part if omitted.

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) values
  (
    'b2200000-0000-0000-0000-000000000001',
    'b22-tienda@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"tienda","display_name":"B22 Tienda"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'b2200000-0000-0000-0000-000000000002',
    'b22-cliente@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"cliente","display_name":"B22 Cliente"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'b2200000-0000-0000-0000-000000000003',
    'b22-other@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"cliente","display_name":"B22 Other"}',
    'authenticated', 'authenticated', now(), now()
  );

-- Store owned by the tienda user
insert into public.stores (owner_id, name, available) values (
  (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'),
  'B22 Test Store', true
);

-- Base order used for function behaviour tests
insert into public.orders (store_id, customer_id, status, customer_location) values (
  (select id from public.stores
   where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001')),
  (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000002'),
  'enviado',
  st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
);

-- ─── Plan ────────────────────────────────────────────────────────────────────
select plan(27);

-- ─── 1-3: function existence ─────────────────────────────────────────────────
select has_function('public', 'is_store_owner', array['bigint'],    'is_store_owner(bigint) should exist');
select has_function('public', 'owns_order',     array['bigint'],    'owns_order(bigint) should exist');
select has_function('public', 'has_role',       array['user_role'], 'has_role(user_role) should exist');

-- ─── 4-6: SECURITY DEFINER ───────────────────────────────────────────────────
select is(
  (select prosecdef from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'is_store_owner'),
  true, 'is_store_owner should be SECURITY DEFINER'
);

select is(
  (select prosecdef from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'owns_order'),
  true, 'owns_order should be SECURITY DEFINER'
);

select is(
  (select prosecdef from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'has_role'
     and pg_get_function_identity_arguments(p.oid) = 'p_role user_role'),
  true, 'has_role should be SECURITY DEFINER'
);

-- ─── 7-9: hardened search_path ───────────────────────────────────────────────
select is(
  (select proconfig from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'is_store_owner'),
  array['search_path=""'], 'is_store_owner should have search_path set to empty string'
);

select is(
  (select proconfig from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'owns_order'),
  array['search_path=""'], 'owns_order should have search_path set to empty string'
);

select is(
  (select proconfig from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'has_role'
     and pg_get_function_identity_arguments(p.oid) = 'p_role user_role'),
  array['search_path=""'], 'has_role should have search_path set to empty string'
);

-- ─── 10-11: is_store_owner behaviour ─────────────────────────────────────────
-- auth.uid() reads from request.jwt.claims; set it per-assertion.

select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000001')::text, true);

select is(
  public.is_store_owner(
    (select id from public.stores
     where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
  ),
  true, 'is_store_owner returns true for the store owner'
);

select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000002')::text, true);

select is(
  public.is_store_owner(
    (select id from public.stores
     where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
  ),
  false, 'is_store_owner returns false for a non-owner'
);

-- ─── 12-14: owns_order behaviour ─────────────────────────────────────────────
select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000002')::text, true);

select is(
  public.owns_order(
    (select id from public.orders
     where customer_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000002')
     limit 1)
  ),
  true, 'owns_order returns true for the order customer'
);

select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000001')::text, true);

select is(
  public.owns_order(
    (select id from public.orders
     where store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
     limit 1)
  ),
  true, 'owns_order returns true for the store owner'
);

select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000003')::text, true);

select is(
  public.owns_order(
    (select id from public.orders
     where store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
     limit 1)
  ),
  false, 'owns_order returns false for an unrelated user'
);

-- ─── 15-16: has_role behaviour ────────────────────────────────────────────────
select set_config('request.jwt.claims',
  json_build_object('sub', 'b2200000-0000-0000-0000-000000000001')::text, true);

select is(public.has_role('tienda'::public.user_role),  true,  'has_role returns true for matching role');
select is(public.has_role('cliente'::public.user_role), false, 'has_role returns false for non-matching role');

-- ─── 17: view existence ───────────────────────────────────────────────────────
select has_view('public', 'orders_for_tienda', 'orders_for_tienda view should exist');

-- ─── 18: security_barrier is enabled ─────────────────────────────────────────
select ok(
  'security_barrier=true' = any(
    select unnest(reloptions)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders_for_tienda'
  ),
  'orders_for_tienda should have security_barrier enabled'
);

-- ─── 19: security_invoker is enabled ─────────────────────────────────────────
select ok(
  'security_invoker=true' = any(
    select unnest(reloptions)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders_for_tienda'
  ),
  'orders_for_tienda should have security_invoker enabled'
);

-- ─── 20-27: customer_location masking by status ───────────────────────────────
-- Insert one order per status so we can verify the CASE expression.
-- Scoped to the test store so the queries don't pick up unrelated rows.
-- Terminal rejection states (rechazado, cancelado, expirado) also receive NULL
-- per PRD §7.2 — the ELSE NULL catch-all covers them.

insert into public.orders (store_id, customer_id, status, customer_location)
select
  (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001')),
  (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000002'),
  s.status,
  st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
from (values
  ('recibido'::public.order_status),
  ('aceptado'::public.order_status),
  ('en_camino'::public.order_status),
  ('finalizado'::public.order_status),
  ('rechazado'::public.order_status),
  ('cancelado'::public.order_status),
  ('expirado'::public.order_status)
) as s(status);

-- Test NULL masking for pre-ACEPTADO statuses
select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'enviado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is null,
  'customer_location is NULL for enviado'
);

select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'recibido'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is null,
  'customer_location is NULL for recibido'
);

-- Test location visibility for post-ACEPTADO statuses
select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'aceptado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is not null,
  'customer_location is visible for aceptado'
);

select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'en_camino'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is not null,
  'customer_location is visible for en_camino'
);

select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'finalizado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is not null,
  'customer_location is visible for finalizado'
);

-- Test NULL masking for terminal rejection statuses (PRD §7.2)
select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'rechazado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is null,
  'customer_location is NULL for rechazado'
);

select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'cancelado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is null,
  'customer_location is NULL for cancelado'
);

select ok(
  (
    select customer_location
    from public.orders_for_tienda
    where status = 'expirado'
      and store_id = (select id from public.stores where owner_id = (select id from public.users where auth_user_id = 'b2200000-0000-0000-0000-000000000001'))
    limit 1
  ) is null,
  'customer_location is NULL for expirado'
);

select finish();
rollback;
