-- B2.1 — Row Level Security policies for all domain tables.
-- Rules applied: security-rls-basics (CRITICAL), security-rls-performance (CRITICAL),
--                security-privileges (HIGH).
--
-- Pattern: (select auth.uid()) — evaluated once per query, not per row (5-10x faster).
-- All tables: ENABLE + FORCE RLS so even the table owner can't bypass.
-- Service role (service_key) bypasses RLS by design — that is the correct behaviour
-- for internal cron jobs and server actions.
--
-- SELECT policies: consolidated to ONE policy per table per role to avoid the
-- "multiple permissive policies" performance penalty (Supabase advisor 0006).
-- Each combined policy uses OR so all permitted actors are covered.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: get the internal bigint id for the current auth user.
-- Used in policies that need to compare with FK columns (owner_id, customer_id, …).
-- security definer + fixed search_path prevents search_path hijacking.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.current_user_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.users where auth_user_id = (select auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: get the store_id owned by the current auth user (tienda role).
-- Returns NULL when the caller is not a tienda owner.
-- security definer + fixed search_path prevents search_path hijacking.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.current_store_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.stores s
  join public.users u on u.id = s.owner_id
  where u.auth_user_id = (select auth.uid())
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: true when the current auth user has role = 'admin'.
-- security definer + fixed search_path prevents search_path hijacking.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.users force row level security;

-- SELECT: own row OR admin sees all.
-- Single permissive policy to avoid the "multiple permissive policies" perf penalty.
create policy "users: select"
  on public.users
  for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (select public.is_admin())
  );

-- Any authenticated user can update only their own row.
-- role changes are handled by server actions that use the service role.
create policy "users: update own row"
  on public.users
  for update
  to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

-- INSERT is handled by the auth trigger (server side, service role) — deny direct insert.
-- DELETE is never allowed client-side; deactivation is a soft-delete via server action.

-- ─────────────────────────────────────────────────────────────────────────────
-- stores
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.stores enable row level security;
alter table public.stores force row level security;

-- SELECT: available stores (map), own store (regardless of availability), or admin.
-- Single permissive policy to avoid multiple-permissive-policies advisory.
create policy "stores: select"
  on public.stores
  for select
  to authenticated
  using (
    available = true
    or owner_id = (select public.current_user_id())
    or (select public.is_admin())
  );

-- Only the owner can update their own store.
create policy "stores: owner update own"
  on public.stores
  for update
  to authenticated
  using (owner_id = (select public.current_user_id()))
  with check (owner_id = (select public.current_user_id()));

-- INSERT / DELETE handled by server actions (service role).

-- ─────────────────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products enable row level security;
alter table public.products force row level security;

-- SELECT: available products, all products of own store, or admin.
-- Single permissive policy to avoid multiple-permissive-policies advisory.
create policy "products: select"
  on public.products
  for select
  to authenticated
  using (
    available = true
    or store_id = (select public.current_store_id())
    or (select public.is_admin())
  );

-- Only the store owner can insert products for their store.
create policy "products: owner insert"
  on public.products
  for insert
  to authenticated
  with check (store_id = (select public.current_store_id()));

-- Only the store owner can update their products.
create policy "products: owner update"
  on public.products
  for update
  to authenticated
  using (store_id = (select public.current_store_id()))
  with check (store_id = (select public.current_store_id()));

-- Only the store owner can delete their products.
create policy "products: owner delete"
  on public.products
  for delete
  to authenticated
  using (store_id = (select public.current_store_id()));

-- ─────────────────────────────────────────────────────────────────────────────
-- orders
-- PRD §7.2: customer_location must NOT be exposed to tienda until status is
--           'aceptado', 'en_camino', or 'finalizado'.
-- PRD §7.3: tienda only sees orders belonging to its own store.
-- Note: customer_location privacy for tienda SELECT is handled in B2.2 via a
--       security-barrier view (orders_for_tienda). The RLS policy grants row
--       visibility; the view controls column exposure.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders enable row level security;
alter table public.orders force row level security;

-- SELECT: own orders (customer), own store orders (tienda), or admin.
-- Single permissive policy to avoid multiple-permissive-policies advisory.
create policy "orders: select"
  on public.orders
  for select
  to authenticated
  using (
    customer_id = (select public.current_user_id())
    or store_id = (select public.current_store_id())
    or (select public.is_admin())
  );

-- Customers can create orders (INSERT).
-- Store validation and status init are enforced by server action.
create policy "orders: customer insert"
  on public.orders
  for insert
  to authenticated
  with check (customer_id = (select public.current_user_id()));

-- Status transitions are handled by server actions (service role).
-- Direct UPDATE from client is denied — no UPDATE policy for authenticated.
-- (service role bypasses RLS, so server actions can update freely.)

-- ─────────────────────────────────────────────────────────────────────────────
-- order_items  (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.order_items enable row level security;
alter table public.order_items force row level security;

-- SELECT: own order items (customer), own store order items (tienda), or admin.
-- Single permissive policy to avoid multiple-permissive-policies advisory.
create policy "order_items: select"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = (select public.current_user_id())
          or o.store_id = (select public.current_store_id())
        )
    )
    or (select public.is_admin())
  );

-- Customers insert items when creating an order.
create policy "order_items: customer insert"
  on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = (select public.current_user_id())
    )
  );

-- No UPDATE or DELETE for order_items — append-only by design.

-- ─────────────────────────────────────────────────────────────────────────────
-- store_locations  (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.store_locations enable row level security;
alter table public.store_locations force row level security;

-- All authenticated users can read store locations (needed for map).
create policy "store_locations: authenticated select"
  on public.store_locations
  for select
  to authenticated
  using (true);

-- Only the store owner can insert location updates for their store.
create policy "store_locations: owner insert"
  on public.store_locations
  for insert
  to authenticated
  with check (store_id = (select public.current_store_id()));

-- No UPDATE or DELETE — append-only by design (history is valuable).

-- ─────────────────────────────────────────────────────────────────────────────
-- push_subscriptions
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;

-- Users can read only their own push subscriptions.
create policy "push_subscriptions: select own"
  on public.push_subscriptions
  for select
  to authenticated
  using (user_id = (select public.current_user_id()));

-- Users can register (insert) their own push subscription.
create policy "push_subscriptions: insert own"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = (select public.current_user_id()));

-- Users can update their own push subscription (e.g. refresh keys).
create policy "push_subscriptions: update own"
  on public.push_subscriptions
  for update
  to authenticated
  using (user_id = (select public.current_user_id()))
  with check (user_id = (select public.current_user_id()));

-- Users can delete (unsubscribe) their own push subscription.
create policy "push_subscriptions: delete own"
  on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = (select public.current_user_id()));

-- ─────────────────────────────────────────────────────────────────────────────
-- audit_log  (append-only — INSERT only, no SELECT for clients)
-- Only service role (server actions, cron) writes to audit_log.
-- Admins can read it; regular users cannot.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

-- Admins can read the audit log.
create policy "audit_log: admin select"
  on public.audit_log
  for select
  to authenticated
  using ((select public.is_admin()));

-- No INSERT/UPDATE/DELETE from client — audit_log is written exclusively by
-- service role (server actions, triggers). No client-facing INSERT policy.
