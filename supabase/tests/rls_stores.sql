-- pgTAP test: B2.3 — RLS policies for public.stores
-- Covers: (a) positivos — available stores visible to all; owner sees own
--         (b) negativos — unavailable stores hidden from non-owners
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
  ),
  (
    'b2300000-0000-0000-0000-000000000005', 'b23-admin@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","display_name":"B23 Admin"}',
    'authenticated', 'authenticated', now(), now()
  );

-- store1: available (visible to anyone authenticated)
insert into public.stores (owner_id, name, available) values (
  (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000003'),
  'B23 Store1', true
);

-- store2: unavailable (only visible to its owner and admins)
insert into public.stores (owner_id, name, available) values (
  (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000004'),
  'B23 Store2', false
);

-- Stash store2 owner bigint id before role switch — RLS hides it from non-owner authenticated role
select set_config('test.store2_owner_id',
  (select id::text from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000004'),
  true);

-- ─── Plan ─────────────────────────────────────────────────────────────────────
select plan(8);

-- 1: policy "stores: select" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'stores' and policyname = 'stores: select'),
  'policy "stores: select" should exist on stores table'
);

-- 2: positive SELECT — any authenticated user sees available stores
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.stores where name = 'B23 Store1'),
  1,
  'any authenticated user can see available stores'
);
reset role;

-- 3: negative SELECT — user cannot see an unavailable store they don't own
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.stores where name = 'B23 Store2'),
  0,
  'user cannot see an unavailable store they do not own'
);
reset role;

-- 4: positive SELECT — tienda owner sees their own unavailable store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000004')::text, true);
select is(
  (select count(*)::int from public.stores where name = 'B23 Store2'),
  1,
  'tienda owner can see their own unavailable store'
);
reset role;

-- 5: positive SELECT — admin sees all stores regardless of availability
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000005')::text, true);
select is(
  (select count(*)::int from public.stores where name in ('B23 Store1', 'B23 Store2')),
  2,
  'admin can see all stores'
);
reset role;

-- 6: policy "stores: owner update own" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'stores' and policyname = 'stores: owner update own'),
  'policy "stores: owner update own" should exist on stores table'
);

-- 7: positive UPDATE — tienda owner can update their own store
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
update public.stores set name = 'B23 Store1 Updated'
where owner_id = (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000003');
reset role;
-- verify as superuser so SELECT policy doesn't interfere with the assertion
select is(
  (select name from public.stores
   where owner_id = (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000003')),
  'B23 Store1 Updated',
  'tienda owner can UPDATE their own store'
);

-- 8: negative UPDATE — another user cannot update a store they don't own
-- store2_owner_id was stashed as superuser before role switch to bypass SELECT RLS on users
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
update public.stores set name = 'Hacked'
where owner_id = current_setting('test.store2_owner_id')::bigint;
reset role;
-- verify as superuser that the value is unchanged
select is(
  (select name from public.stores
   where owner_id = current_setting('test.store2_owner_id')::bigint),
  'B23 Store2',
  'non-owner cannot UPDATE another tienda''s store (RLS blocks)'
);

select finish();
rollback;
