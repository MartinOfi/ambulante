-- pgTAP test: B7.1 — schedule_crons migration
-- Run with: supabase test db

begin;
select plan(8);

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

-- 8. cron schedules match PRD §7.6 intervals
select is(
  (select schedule from cron.job where jobname = 'expire-orders'),
  '* * * * *',
  'expire-orders should run every minute'
);

select finish();
rollback;
