-- B10-A.1 — Store validation lifecycle status
--
-- Adds an enum + column on public.stores to track the moderation lifecycle of a
-- store: pending (just registered, awaiting admin review), approved (passed
-- admin review), rejected (admin rejected the validation docs).
--
-- This is independent from `stores.available` (runtime open/closed/stale) and
-- exists so the public map can hide stores that have not been validated yet.
--
-- Skill rules: schema-lowercase-identifiers, schema-foreign-key-indexes (n/a).

-- 1. Enum type for the lifecycle states
do $$
begin
  create type public.store_validation_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- 2. Column on stores. NOT NULL with default 'pending' so existing rows get a
--    sensible value and every new store starts in the moderation queue.
alter table public.stores
  add column if not exists validation_status public.store_validation_status
    not null
    default 'pending'::public.store_validation_status;

-- 3. Index for the admin moderation queue (filter by status, sort by created_at).
--    The admin panel reads "pending stores" frequently; without an index this is
--    a sequential scan on the whole stores table.
create index if not exists stores_validation_status_idx
  on public.stores (validation_status, created_at desc);
