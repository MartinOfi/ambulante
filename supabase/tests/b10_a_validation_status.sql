-- pgTAP test: B10-A — validation_status + cuit migration
-- Covers: enum store_validation_status, column on stores, default, NOT NULL,
--         validation_status index, cuit column, and stores_view exposure.
-- Run with: pnpm supabase:test

begin;

select plan(10);

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

-- 7. index on validation_status exists for efficient admin queue queries
select has_index(
  'public',
  'stores',
  'stores_validation_status_idx',
  'stores_validation_status_idx index should exist on public.stores'
);

-- 8. cuit column exists on stores
select ok(
  exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'cuit'
  ),
  'public.stores.cuit column should exist'
);

-- 9. cuit column is nullable (optional at DB level; required by onboarding form)
select is(
  (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'cuit'
  ),
  'YES',
  'stores.cuit should be nullable'
);

-- 10. stores_view exposes cuit
select ok(
  exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores_view'
      and column_name = 'cuit'
  ),
  'stores_view should expose the cuit column'
);

select * from finish();

rollback;
