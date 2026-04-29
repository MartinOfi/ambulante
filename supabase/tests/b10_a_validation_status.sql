-- pgTAP test: B10-A.1 — validation_status migration
-- Covers: enum store_validation_status, column on stores, default, NOT NULL.
-- Run with: pnpm supabase:test

begin;

select plan(6);

-- 1. enum type store_validation_status exists
select ok(
  exists(
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'store_validation_status'
      and n.nspname = 'public'
      and t.typtype = 'e'
  ),
  'public.store_validation_status enum should exist'
);

-- 2. enum has exactly the 3 expected values
select bag_eq(
  $$ select unnest(enum_range(null::public.store_validation_status))::text $$,
  $$ values ('pending'), ('approved'), ('rejected') $$,
  'enum should expose pending/approved/rejected'
);

-- 3. column public.stores.validation_status exists
select ok(
  exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'validation_status'
  ),
  'public.stores.validation_status column should exist'
);

-- 4. column type is the new enum
select is(
  (
    select udt_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'validation_status'
  ),
  'store_validation_status',
  'validation_status column type should be public.store_validation_status'
);

-- 5. default is 'pending'
select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'validation_status'
  ),
  '''pending''::store_validation_status',
  'validation_status default should be pending'
);

-- 6. NOT NULL
select is(
  (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'validation_status'
  ),
  'NO',
  'validation_status should be NOT NULL'
);

select * from finish();

rollback;
