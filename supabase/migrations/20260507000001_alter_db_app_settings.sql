-- NT-27: inject app.settings.* as database-level custom GUC parameters.
-- ALTER DATABASE requires superuser; migrations run as supabase_admin (superuser),
-- unlike seed.sql which runs as postgres (no ALTER DATABASE privilege).
--
-- Values here are local-dev defaults; they are overridden in prod via the
-- Supabase Dashboard / secrets vault (B14 — prod env setup).
-- internal.call_cron_endpoint() reads these via current_setting(..., missing_ok).

alter database postgres set "app.settings.cron_secret" = 'dev-cron-secret-local-only-placeholder';
alter database postgres set "app.settings.site_url"    = 'http://localhost:3000';
