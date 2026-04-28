-- Enable all extensions required by the Ambulante backend.
-- `create extension if not exists` is idempotent — safe to run after supabase db reset.

-- PostGIS: geospatial types and operators (store locations, radius queries)
create extension if not exists postgis with schema extensions;

-- pgcrypto: gen_random_uuid(), crypt(), digest() (public_id columns, tokens)
create extension if not exists pgcrypto with schema extensions;

-- pg_stat_statements: per-query execution statistics (see monitor-pg-stat-statements rule)
-- Configured with track = 'all' in config.toml to capture all statement types.
create extension if not exists pg_stat_statements with schema extensions;

-- pg_cron: schema is hardcoded in the extension source — must be pg_cron, not extensions
create extension if not exists pg_cron with schema pg_cron;
grant usage on schema pg_cron to postgres;

-- pg_net: schema is hardcoded as net in the extension source
create extension if not exists pg_net with schema net;

-- pgtap: installed in public so test runner can call ok()/plan()/etc. unqualified
create extension if not exists pgtap with schema public;
