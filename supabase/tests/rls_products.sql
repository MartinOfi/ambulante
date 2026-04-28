-- pgTAP test: B2.3 — RLS policies for public.products
-- Covers: (a) positivos — store owner CRUDs own products; any user sees available
--         (b) negativos — cross-store isolation for unavailable products and writes
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

-- product1 in store1: available
insert into public.products (store_id, name, price, available) values (
  (select id from public.stores where name = 'B23 Store1'),
  'B23 Product1', 100.00, true
);

-- product2 in store2: unavailable (hidden from non-owners)
insert into public.products (store_id, name, price, available) values (
  (select id from public.stores where name = 'B23 Store2'),
  'B23 Product2', 200.00, false
);

-- Stash store1 id before role switch — needed for negative UPDATE from tienda2
select set_config('test.store1_id',
  (select id::text from public.stores where name = 'B23 Store1'),
  true);

-- ─── Plan ─────────────────────────────────────────────────────────────────────
select plan(11);

-- 1: policy "products: select" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products: select'),
  'policy "products: select" should exist on products table'
);

-- 2: positive SELECT — any authenticated user sees available products
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.products where name = 'B23 Product1'),
  1,
  'any authenticated user can see available products'
);
reset role;

-- 3: negative SELECT — user cannot see unavailable product from another store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.products where name = 'B23 Product2'),
  0,
  'user cannot see unavailable product from a store they do not own'
);
reset role;

-- 4: positive SELECT — tienda owner sees own unavailable products
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000004')::text, true);
select is(
  (select count(*)::int from public.products where name = 'B23 Product2'),
  1,
  'tienda owner can see their own unavailable products'
);
reset role;

-- 5: policy "products: owner insert" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products: owner insert'),
  'policy "products: owner insert" should exist on products table'
);

-- 5b: policy "products: owner update" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products: owner update'),
  'policy "products: owner update" should exist on products table'
);

-- 5c: policy "products: owner delete" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products: owner delete'),
  'policy "products: owner delete" should exist on products table'
);

-- 6: positive INSERT — tienda owner can add a product to own store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select lives_ok(
  $$ insert into public.products (store_id, name, price) values (
       (select id from public.stores where name = 'B23 Store1'),
       'B23 New Product', 50.00
     ) $$,
  'tienda owner can INSERT product for own store'
);
reset role;

-- 7: negative INSERT — non-owner cannot insert product for another store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ insert into public.products (store_id, name, price) values (
       (select id from public.stores where name = 'B23 Store1'),
       'Injected Product', 1.00
     ) $$,
  '42501',
  null,
  'non-owner cannot INSERT product into another store (RLS denies)'
);
reset role;

-- 8: positive UPDATE — tienda owner can update price of own product
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000004')::text, true);
update public.products set price = 999.00 where name = 'B23 Product2';
reset role;
-- verify as superuser that the price changed
select is(
  (select price from public.products where name = 'B23 Product2'),
  999.00::numeric,
  'tienda owner can UPDATE price of their own product'
);

-- 9: negative UPDATE — non-owner cannot update a product from another store
-- store1_id was stashed as superuser — tienda2 cannot look it up via RLS
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000004')::text, true);
update public.products set price = 1.00
where store_id = current_setting('test.store1_id')::bigint;
reset role;
-- verify as superuser that the price is unchanged
select is(
  (select price from public.products where name = 'B23 Product1'),
  100.00::numeric,
  'non-owner cannot UPDATE product from another store (RLS blocks)'
);

select finish();
rollback;
