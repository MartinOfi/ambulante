-- =============================================================================
-- MIGRATION TEMPLATE — NOT A REAL MIGRATION
-- This file is intentionally named without a timestamp prefix so that
-- `supabase db push` / `supabase db reset` ignores it.
--
-- Copy this file, rename it to:  YYYYMMDDhhmmss_description_in_snake_case.sql
-- Then replace the examples below with your actual DDL.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CREATE TABLE (built-in IF NOT EXISTS — safe to repeat)
-- ---------------------------------------------------------------------------
create table if not exists public.example (
  id        bigint generated always as identity primary key,
  name      text        not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. ADD COLUMN (built-in IF NOT EXISTS — safe to repeat since Postgres 9.6)
-- ---------------------------------------------------------------------------
alter table public.example
  add column if not exists description text;

-- ---------------------------------------------------------------------------
-- 3. ADD CONSTRAINT
-- Postgres has NO "ADD CONSTRAINT IF NOT EXISTS" syntax.
-- Use a DO block that checks pg_constraint before adding.
-- Applies to: UNIQUE, CHECK, FOREIGN KEY, EXCLUDE.
-- (PRIMARY KEY is set at table creation — see pattern 1.)
-- ---------------------------------------------------------------------------

-- UNIQUE constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname     = 'example_name_unique'
      and conrelid    = 'public.example'::regclass
  ) then
    alter table public.example
      add constraint example_name_unique unique (name);
  end if;
end $$;

-- CHECK constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname  = 'example_name_nonempty'
      and conrelid = 'public.example'::regclass
  ) then
    alter table public.example
      add constraint example_name_nonempty check (char_length(name) > 0);
  end if;
end $$;

-- FOREIGN KEY constraint (always add the index in the same migration — rule schema-foreign-key-indexes)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname  = 'child_example_id_fkey'
      and conrelid = 'public.child'::regclass
  ) then
    alter table public.child
      add constraint child_example_id_fkey
      foreign key (example_id) references public.example (id)
      on delete cascade;
  end if;
end $$;

-- Index for the FK above (CREATE INDEX IF NOT EXISTS — safe to repeat since Postgres 9.5)
create index if not exists idx_child_example_id on public.child (example_id);

-- ---------------------------------------------------------------------------
-- 4. DROP CONSTRAINT (IF EXISTS is supported natively — safe to repeat)
-- ---------------------------------------------------------------------------
alter table public.example
  drop constraint if exists example_old_constraint;

-- ---------------------------------------------------------------------------
-- 5. CREATE INDEX (built-in IF NOT EXISTS — safe to repeat)
-- ---------------------------------------------------------------------------
create index if not exists idx_example_created_at on public.example (created_at desc);

-- Partial index
create index if not exists idx_example_active
  on public.example (created_at desc)
  where description is not null;

-- ---------------------------------------------------------------------------
-- 6. ENUM / custom TYPE
-- Postgres has no "CREATE TYPE IF NOT EXISTS" — use EXCEPTION pattern.
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.example_status as enum ('active', 'inactive', 'archived');
exception
  when duplicate_object then null;
end $$;

-- Add a value to an existing enum (IF NOT EXISTS available since Postgres 9.6)
alter type public.example_status
  add value if not exists 'pending' before 'active';

-- ---------------------------------------------------------------------------
-- 7. CREATE OR REPLACE FUNCTION (idempotent by design)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 8. CREATE TRIGGER (check pg_trigger before creating)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname      = 'trg_example_updated_at'
      and tgrelid     = 'public.example'::regclass
      and tgisinternal = false
  ) then
    create trigger trg_example_updated_at
      before update on public.example
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 9. ROW-LEVEL SECURITY
-- Policies use pg_policy for existence checks.
-- ENABLE ROW LEVEL SECURITY is idempotent (safe to repeat without a guard).
-- Always enable RLS before adding policies.
-- ---------------------------------------------------------------------------
alter table public.example enable row level security;

-- "Authenticated only" policy: any signed-in user can select any row.
do $$
begin
  if not exists (
    select 1 from pg_policy
    where polname  = 'example_select_authenticated'
      and polrelid = 'public.example'::regclass
  ) then
    create policy example_select_authenticated
      on public.example
      for select
      using ((select auth.uid()) is not null);
  end if;
end $$;

-- "Own rows only" policy: user can only select rows they own.
-- Requires a column (e.g. user_id) that references auth.users(id).
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_policy
--     where polname  = 'example_select_own'
--       and polrelid = 'public.example'::regclass
--   ) then
--     create policy example_select_own
--       on public.example
--       for select
--       using ((select auth.uid()) = user_id);
--   end if;
-- end $$;
