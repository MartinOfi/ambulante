-- Migration: 001_audit_log
-- Purpose: Append-only audit log for all order state transitions (PRD §6.2)
-- Append-only semantics enforced at DB level: UPDATE and DELETE are blocked via RLS.

create table if not exists order_audit_log (
  id           uuid        primary key default gen_random_uuid(),
  order_id     text        not null,
  actor        text        not null check (actor in ('CLIENTE', 'TIENDA', 'SISTEMA')),
  event_type   text        not null,
  from_status  text        not null,
  to_status    text        not null,
  occurred_at  timestamptz not null
);

-- Index for the primary read pattern: fetch all entries for a given order.
create index if not exists order_audit_log_order_id_idx
  on order_audit_log (order_id, occurred_at asc);

-- Enable RLS.
alter table order_audit_log enable row level security;

-- Service role (backend) can insert.
create policy "service_insert"
  on order_audit_log
  for insert
  to service_role
  with check (true);

-- Service role can read all entries.
create policy "service_select"
  on order_audit_log
  for select
  to service_role
  using (true);

-- Explicitly block UPDATE for all roles — append-only invariant.
create policy "no_update"
  on order_audit_log
  for update
  using (false);

-- Explicitly block DELETE for all roles — append-only invariant.
create policy "no_delete"
  on order_audit_log
  for delete
  using (false);
