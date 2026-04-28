-- Seed data for local development.
-- Applied automatically after migrations during `pnpm supabase:reset`.
-- Keep idempotent: use INSERT ... ON CONFLICT DO NOTHING.

-- ---------------------------------------------------------------------------
-- PostgreSQL custom settings consumed by internal.call_cron_endpoint() (B7.1).
-- In production these are set via the Supabase secrets dashboard (B14).
-- The cron_secret value must be ≥16 chars (matches env.schema.ts min length).
-- site_url points to the local Next.js dev server; pg_net fires against it.
-- ---------------------------------------------------------------------------
alter database postgres set "app.settings.cron_secret" = 'dev-cron-secret-min-16-chars!!';
alter database postgres set "app.settings.site_url"    = 'http://127.0.0.1:3000';
