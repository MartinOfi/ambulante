-- pgTAP test: B7.1 — schedule_crons migration
-- Run with: supabase test db

begin;

-- Inject settings scoped to this transaction so future in-test function calls
-- (e.g. direct invocations of call_cron_endpoint) see a valid secret.
-- ALTER DATABASE SET only applies to new connections; set_config(..., true) is
-- the correct mechanism for transaction-scoped settings in pgTAP tests.
select set_config('app.settings.cron_secret', 'dev-cron-secret-min-16-chars!!', true);
select set_config('app.settings.site_url',    'http://127.0.0.1:3000',          true);

select plan(11);

-- 1. internal schema exists
select has_schema('internal', 'internal schema should exist');

-- 2. call_cron_endpoint function exists
select has_function(
  'internal',
  'call_cron_endpoint',
  array['text'],
  'internal.call_cron_endpoint(text) should exist'
);

-- 3. function is SECURITY DEFINER
select is(
  (
    select prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'internal' and p.proname = 'call_cron_endpoint'
  ),
  true,
  'call_cron_endpoint should be SECURITY DEFINER'
);

-- 4. function owner is postgres (not anonymous roles)
select is(
  (
    select pg_get_userbyid(p.proowner)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'internal' and p.proname = 'call_cron_endpoint'
  ),
  'postgres',
  'call_cron_endpoint should be owned by postgres'
);

-- 5. public has no EXECUTE privilege on the function
select function_privs_are(
  'internal',
  'call_cron_endpoint',
  array['text'],
  'public',
  array[]::text[],
  'public should have no privileges on call_cron_endpoint'
);

-- 6. expire-orders cron job is registered
select is(
  (select count(*)::int from cron.job where jobname = 'expire-orders'),
  1,
  'expire-orders cron job should be registered'
);

-- 7. auto-close-orders cron job is registered
select is(
  (select count(*)::int from cron.job where jobname = 'auto-close-orders'),
  1,
  'auto-close-orders cron job should be registered'
);

-- 8. expire-orders schedule matches PRD §7.6 (every 1 min → catches 10min expiry window)
select is(
  (select schedule from cron.job where jobname = 'expire-orders'),
  '* * * * *',
  'expire-orders should run every minute'
);

-- 9. auto-close-orders schedule matches PRD §7.6 (every 10 min → 2h auto-close window)
select is(
  (select schedule from cron.job where jobname = 'auto-close-orders'),
  '*/10 * * * *',
  'auto-close-orders should run every 10 minutes'
);

-- 10. function search_path is hardened to empty string (prevents search_path hijacking)
-- Postgres 15+ stores empty search_path as 'search_path=""'; older versions as 'search_path='.
select ok(
  exists(
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace,
    unnest(p.proconfig) as cfg
    where n.nspname = 'internal' and p.proname = 'call_cron_endpoint'
      and cfg in ('search_path=', 'search_path=""')
  ),
  'call_cron_endpoint should have search_path set to empty string'
);

-- 11. public has no USAGE privilege on the internal schema
select schema_privs_are(
  'internal',
  'public',
  array[]::text[],
  'public should have no privileges on internal schema'
);

select finish();
rollback;
