-- Seed data for local development.
-- Applied automatically after migrations during `pnpm supabase:reset`.
-- Keep idempotent: use INSERT ... ON CONFLICT DO NOTHING.

-- app.settings.cron_secret and app.settings.site_url are intentionally NOT set here.
-- ALTER DATABASE SET requires superuser and is not supported in seeds or migrations
-- with this Supabase CLI version. internal.call_cron_endpoint() handles missing
-- settings gracefully via current_setting(..., true) (missing_ok = true).
