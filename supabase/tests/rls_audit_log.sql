-- pgTAP test: B2.3 — RLS policies for public.audit_log
-- Covers: (a) positivo  — admin can SELECT all rows
--         (b) negativos — non-admin cannot SELECT; authenticated cannot INSERT
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
    'b2300000-0000-0000-0000-000000000005', 'b23-admin@test.local', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","display_name":"B23 Admin"}',
    'authenticated', 'authenticated', now(), now()
  );

-- Insert audit rows as superuser (service role bypass — the real write path)
insert into public.audit_log (table_name, operation, row_id, new_values, actor_id) values
  (
    'orders', 'INSERT', 1,
    '{"status":"enviado"}',
    (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000001')
  ),
  (
    'orders', 'UPDATE', 1,
    '{"status":"aceptado"}',
    (select id from public.users where auth_user_id = 'b2300000-0000-0000-0000-000000000003')
  );

-- ─── Plan ─────────────────────────────────────────────────────────────────────
select plan(5);

-- 1: policy "audit_log: admin select" exists
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_log' and policyname = 'audit_log: admin select'),
  'policy "audit_log: admin select" should exist on audit_log table'
);

-- 2: positive SELECT — admin sees all audit_log rows
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000005')::text, true);
select is(
  (select count(*)::int from public.audit_log),
  2,
  'admin can SELECT all audit_log rows'
);
reset role;

-- 3: negative SELECT — cliente cannot see any audit_log rows
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select is(
  (select count(*)::int from public.audit_log),
  0,
  'cliente cannot SELECT any audit_log rows'
);
reset role;

-- 4: negative SELECT — tienda cannot see any audit_log rows
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000003')::text, true);
select is(
  (select count(*)::int from public.audit_log),
  0,
  'tienda cannot SELECT any audit_log rows'
);
reset role;

-- 5: negative INSERT — authenticated user cannot INSERT into audit_log (no INSERT policy)
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b2300000-0000-0000-0000-000000000001')::text, true);
select throws_ok(
  $$ insert into public.audit_log (table_name, operation, row_id, new_values)
     values ('users', 'DELETE', 99, '{"injected":true}') $$,
  '42501',
  null,
  'authenticated user cannot INSERT into audit_log (no INSERT policy)'
);
reset role;

select finish();
rollback;
