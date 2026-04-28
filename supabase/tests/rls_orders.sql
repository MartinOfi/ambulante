-- pgTAP test: B2.3 — RLS policies for public.orders
-- Covers: (a) positivos — customer/tienda CRUD isolation
--         (b) negativos — cross-customer and cross-store isolation
--         (c) location privacy — PRD §7.2 via orders_for_tienda view
-- Run with: pnpm supabase:test:rls

begin;

-- ─── Test data ────────────────────────────────────────────────────────────────
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) values
  (
    'b2300000-0000-0000-0000-000000000001', 'b23-c1@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"cliente","display_name":"B23 Cliente1"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'b2300000-0000-0000-0000-000000000002', 'b23-c2@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"cliente","display_name":"B23 Cliente2"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'b2300000-0000-0000-0000-000000000003', 'b23-t1@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"tienda","display_name":"B23 Tienda1"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'b2300000-0000-0000-0000-000000000004', 'b23-t2@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"tienda","display_name":"B23 Tienda2"}',
    'authenticated', 'authenticated', now(), now()
  );

insert into public.stores (owner_id, name, available) values
  (
    (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000003'),
    'B23 Store1', true
  ),
  (
    (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000004'),
    'B23 Store2', true
  );

-- order1: store1 / cliente1 / enviado — location must be NULL in orders_for_tienda (PRD §7.2)
insert into public.orders (store_id, customer_id, status, customer_location) values (
  (select id from public.stores where name = 'B23 Store1'),
  (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001'),
  'enviado',
  st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
);

-- order2: store1 / cliente1 / aceptado — location must be visible in orders_for_tienda (PRD §7.2)
insert into public.orders (store_id, customer_id, status, customer_location) values (
  (select id from public.stores where name = 'B23 Store1'),
  (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001'),
  'aceptado',
  st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
);

-- order3: store2 / cliente2 / enviado — used for cross-customer and cross-store isolation tests
insert into public.orders (store_id, customer_id, status, customer_location) values (
  (select id from public.stores where name = 'B23 Store2'),
  (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000002'),
  'enviado',
  st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
);

-- Stash cliente2 bigint id before role switch — RLS hides it from cliente1
select set_config('test.cliente2_id',
  (select id::text from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000002'),
  true);

-- ─── Plan ─────────────────────────────────────────────────────────────────────
select plan(11);

-- 1: policy "orders: select" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders: select'),
  'policy "orders: select" should exist on orders table'
);

-- 2: policy "orders: customer insert" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders: customer insert'),
  'policy "orders: customer insert" should exist on orders table'
);

-- 3: positive SELECT — customer sees own orders
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.orders
   where customer_id = (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001')),
  2,
  'customer can SELECT their own orders'
);
reset role;

-- 4: negative SELECT — customer cannot see orders from a store they do not own
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.orders
   where store_id = (select id from public.stores where name = 'B23 Store2')),
  0,
  'customer cannot SELECT orders from a store they do not own'
);
reset role;

-- 5: positive SELECT — tienda sees all orders in own store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select is(
  (select count(*)::int from public.orders
   where store_id = (select id from public.stores where name = 'B23 Store1')),
  2,
  'tienda can SELECT all orders in their own store'
);
reset role;

-- 6: negative SELECT — tienda cannot see orders from another store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select is(
  (select count(*)::int from public.orders
   where store_id = (select id from public.stores where name = 'B23 Store2')),
  0,
  'tienda cannot SELECT orders from another store'
);
reset role;

-- 7: positive INSERT — customer can INSERT order with own customer_id
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select lives_ok(
  $$ insert into public.orders (store_id, customer_id, status, customer_location) values (
       (select id from public.stores where name = 'B23 Store1'),
       (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001'),
       'enviado',
       st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
     ) $$,
  'customer can INSERT an order with their own customer_id'
);
reset role;

-- 8: negative INSERT — customer cannot INSERT order with another customer_id
-- cliente2 bigint id was stashed as superuser before the role switch to avoid RLS hiding it
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ insert into public.orders (store_id, customer_id, status, customer_location) values (
       (select id from public.stores where name = 'B23 Store1'),
       current_setting('test.cliente2_id')::bigint,
       'enviado',
       st_setsrid(st_makepoint(-58.381592, -34.603722), 4326)
     ) $$,
  '42501',
  null,
  'customer cannot INSERT order with another customer_id (RLS denies)'
);
reset role;

-- 9: PRD §7.2 — tienda sees NULL customer_location for pre-ACEPTADO orders in orders_for_tienda
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select ok(
  (select customer_location
   from public.orders_for_tienda
   where status = 'enviado'
     and store_id = (select id from public.stores where name = 'B23 Store1')
   limit 1) is null,
  'tienda sees NULL customer_location for enviado via orders_for_tienda (PRD §7.2)'
);
reset role;

-- 10: PRD §7.2 — tienda sees actual customer_location for post-ACEPTADO orders in orders_for_tienda
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select ok(
  (select customer_location
   from public.orders_for_tienda
   where status = 'aceptado'
     and store_id = (select id from public.stores where name = 'B23 Store1')
   limit 1) is not null,
  'tienda sees actual customer_location for aceptado via orders_for_tienda (PRD §7.2)'
);
reset role;

-- 11: cross-store — tienda2 sees 0 orders from store1 via orders_for_tienda
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000004')::text, true);
select is(
  (select count(*)::int from public.orders_for_tienda
   where store_id = (select id from public.stores where name = 'B23 Store1')),
  0,
  'tienda2 sees 0 rows from store1 via orders_for_tienda (cross-store isolation)'
);
reset role;

select finish();
rollback;
