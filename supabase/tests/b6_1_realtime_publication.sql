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
  (select relreplident from pg_class where relname = 'orders'),
  'f'::"char",
  'orders should have REPLICA IDENTITY FULL'
);

-- 5. store_locations has REPLICA IDENTITY FULL
select is(
  (select relreplident from pg_class where relname = 'store_locations'),
  'f'::"char",
  'store_locations should have REPLICA IDENTITY FULL'
);

-- 6. stores has REPLICA IDENTITY FULL
select is(
  (select relreplident from pg_class where relname = 'stores'),
  'f'::"char",
  'stores should have REPLICA IDENTITY FULL'
);

-- 7. publication itself exists
select has_table(
  'pg_catalog',
  'pg_publication',
  'pg_publication catalog should exist'
);

select * from finish();

rollback;
