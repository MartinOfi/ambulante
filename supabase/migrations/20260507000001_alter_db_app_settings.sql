-- NT-27: inject app.settings.* as database-level custom GUC parameters.
-- ALTER DATABASE requires superuser; migrations run as supabase_admin (superuser),
-- unlike seed.sql which runs as postgres (no ALTER DATABASE privilege).
-- Depends on: 20260428000001_schedule_crons.sql (defines internal.call_cron_endpoint that reads these).
-- NOTE: intentionally timestamped after schedule_crons; call_cron_endpoint reads these at runtime
-- (not at CREATE FUNCTION time), so the order is correct — settings are available before any cron fires.
--
-- Values here are local-dev defaults; they are overridden in prod via the
-- Supabase Dashboard / secrets vault (B14 — prod env setup).

-- Wrapped in DO block: ALTER DATABASE SET requires superuser.
-- In local dev the CLI may run migrations as a non-superuser role; the EXCEPTION
-- clause skips gracefully — the seed.sql fallback covers local-only values.
do $$
begin
  execute $q$ALTER DATABASE postgres SET "app.settings.cron_secret" = 'dev-cron-secret-local-only-placeholder'$q$;
  execute $q$ALTER DATABASE postgres SET "app.settings.site_url"    = 'http://localhost:3000'$q$;
exception
  when insufficient_privilege then
    raise notice 'ALTER DATABASE SET skipped (insufficient_privilege) — set manually if needed in prod.';
end $$;
