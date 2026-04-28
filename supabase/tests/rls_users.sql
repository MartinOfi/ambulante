-- pgTAP test: B2.3 — RLS policies for public.users
-- Covers: (a) positivos — authorized role sees/writes own data
--         (b) negativos — other roles cannot see/write
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
    'b2300000-0000-0000-0000-000000000005', 'b23-admin@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","display_name":"B23 Admin"}',
    'authenticated', 'authenticated', now(), now()
  );

-- ─── Plan ─────────────────────────────────────────────────────────────────────
select plan(8);

-- 1: policy "users: select" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users: select'),
  'policy "users: select" should exist on users table'
);

-- 2: policy "users: update own row" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users: update own row'),
  'policy "users: update own row" should exist on users table'
);

-- 3: positive SELECT — user sees own row
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001'),
  1,
  'user can SELECT their own row'
);
reset role;

-- 4: negative SELECT — user cannot see another user's row
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000002'),
  0,
  'user cannot SELECT another user''s row'
);
reset role;

-- 5: positive SELECT — admin sees all test rows
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000005')::text, true);
select is(
  (select count(*)::int from public.users
   where auth_user_id in (
     'b2300000-0000-0000-0000-000000000001',
     'b2300000-0000-0000-0000-000000000002',
     'b2300000-0000-0000-0000-000000000005'
   )),
  3,
  'admin can SELECT all users rows'
);
reset role;

-- 6: positive UPDATE — user can update own display_name
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
update public.users set display_name = 'Updated'
where auth_user_id = 'b2300000-0000-0000-0000-000000000001';
reset role;
-- verify as superuser so SELECT policy doesn't interfere with the assertion
select is(
  (select display_name from public.users
   where auth_user_id = 'b2300000-0000-0000-0000-000000000001'),
  'Updated',
  'user can UPDATE their own display_name'
);

-- 7: negative UPDATE — user cannot update another user's row (RLS silently skips it)
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
update public.users set display_name = 'Hacked'
where auth_user_id = 'b2300000-0000-0000-0000-000000000002';
reset role;
-- verify as superuser that the value is unchanged
select is(
  (select display_name from public.users
   where auth_user_id = 'b2300000-0000-0000-0000-000000000002'),
  'B23 Cliente2',
  'user cannot UPDATE another user''s display_name (RLS blocks)'
);

-- 8: negative INSERT — direct client INSERT is denied (no INSERT policy for authenticated)
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ insert into public.users (auth_user_id, display_name)
     values ('b2300000-0000-0000-0000-000000000099', 'Injected') $$,
  '42501',
  null,
  'direct INSERT into users is denied by RLS (no INSERT policy for authenticated)'
);
reset role;

select finish();
rollback;
