-- pgTAP test: B6.1 — realtime_publication migration
-- Run with: supabase test db

begin;

select plan(7);

-- 1. orders is in supabase_realtime publication
select ok(
  exists(
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ),
  'orders should be in supabase_realtime publication'
);

-- 2. store_locations is in supabase_realtime publication
select ok(
  exists(
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'store_locations'
  ),
  'store_locations should be in supabase_realtime publication'
);

-- 3. stores is in supabase_realtime publication
select ok(
  exists(
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'stores'
  ),
  'stores should be in supabase_realtime publication'
);

-- 4. orders has REPLICA IDENTITY FULL (required for row-level filters on UPDATE/DELETE)
select is(
  (select c.relreplident from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'orders' and n.nspname = 'public'),
  'f'::"char",
  'orders should have REPLICA IDENTITY FULL'
);

-- 5. store_locations has REPLICA IDENTITY FULL
select is(
  (select c.relreplident from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'store_locations' and n.nspname = 'public'),
  'f'::"char",
  'store_locations should have REPLICA IDENTITY FULL'
);

-- 6. stores has REPLICA IDENTITY FULL
select is(
  (select c.relreplident from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = 'stores' and n.nspname = 'public'),
  'f'::"char",
  'stores should have REPLICA IDENTITY FULL'
);

-- 7. supabase_realtime publication exists
select ok(
  exists(select 1 from pg_publication where pubname = 'supabase_realtime'),
  'supabase_realtime publication should exist'
);

select * from finish();

rollback;
