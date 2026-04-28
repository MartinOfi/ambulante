-- B7.1: schedule_crons + helper pg_net
-- Creates internal.call_cron_endpoint() and registers expire-orders / auto-close-orders.
-- Depends on: B1.1 (pg_cron, pg_net enabled), B0.2 (CRON_SECRET in env schema).
-- app.settings.cron_secret and app.settings.site_url are injected:
--   local dev → supabase/seed.sql (ALTER DATABASE)
--   prod      → Supabase secrets dashboard (B14)

create schema if not exists internal;

-- Revoke public browsability: anon/authenticated must not enumerate internal objects.
-- PostgREST cannot expose internal (absent from config.toml schemas[]), but schema
-- USAGE privilege is still inherited by public by default — remove it explicitly.
revoke all on schema internal from public;
grant usage on schema internal to postgres;

-- ---------------------------------------------------------------------------
-- Helper: fires an authenticated HTTP POST to the Next.js cron route handler.
-- Reads secret + base URL from PostgreSQL custom settings so no sensitive data
-- lives in the migration itself.
-- SECURITY DEFINER + restricted search_path prevents search_path hijacking.
-- net.http_post() is fire-and-forget (async) — safe inside a transaction.
-- ---------------------------------------------------------------------------
create or replace function internal.call_cron_endpoint(path text)
  returns void
  language plpgsql
  security definer
  set search_path = pg_catalog, pg_temp
as $$
declare
  v_secret   text;
  v_base_url text;
begin
  v_secret   := current_setting('app.settings.cron_secret', true);
  v_base_url := current_setting('app.settings.site_url',    true);

  if v_secret is null or length(v_secret) < 16 then
    raise log 'call_cron_endpoint: app.settings.cron_secret missing or too short — skipping %', path;
    return;
  end if;

  if v_base_url is null or v_base_url = '' then
    raise log 'call_cron_endpoint: app.settings.site_url missing — skipping %', path;
    return;
  end if;

  perform net.http_post(
    url     := v_base_url || path,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- Only postgres (the pg_cron runner role) may call this function.
revoke all on function internal.call_cron_endpoint(text) from public;
grant  execute on function internal.call_cron_endpoint(text) to postgres;

-- ---------------------------------------------------------------------------
-- Cron schedules — idempotent: unschedule first to survive re-runs / resets.
-- PRD §7.6: EXPIRADO after 10min → poll every 1min (expire-orders).
--           ACEPTADO auto-close after 2h → poll every 10min (auto-close-orders).
-- ---------------------------------------------------------------------------
select cron.unschedule('expire-orders')
  where exists (select 1 from cron.job where jobname = 'expire-orders');

select cron.unschedule('auto-close-orders')
  where exists (select 1 from cron.job where jobname = 'auto-close-orders');

select cron.schedule(
  'expire-orders',
  '* * * * *',
  $job$ select internal.call_cron_endpoint('/api/cron/expire-orders') $job$
);

select cron.schedule(
  'auto-close-orders',
  '*/10 * * * *',
  $job$ select internal.call_cron_endpoint('/api/cron/auto-close-orders') $job$
);
