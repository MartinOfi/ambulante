-- B2.2 — Security-definer helper functions for cross-tenant RLS checks.
-- Rules applied: security-rls-performance (CRITICAL), security-privileges (HIGH).
--
-- All functions: language sql stable security definer set search_path = ''
-- Each function is backed by an existing index (created in B1.2 / B1.5).
--
-- is_admin() is redeclared with CREATE OR REPLACE for idempotency
-- (canonical definition lives in B2.1 / 20260428000000_rls_policies.sql).

-- ── is_admin() ────────────────────────────────────────────────────────────────
-- Idempotent redeclaration — identical to the B2.1 definition.
-- Index-backed: users_auth_user_id_idx.
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

-- ── is_store_owner(p_store_id bigint) ─────────────────────────────────────────
-- True when the current auth user is the owner of the given store.
-- Index-backed: stores_owner_id_idx + users_auth_user_id_idx.
create or replace function public.is_store_owner(p_store_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    join public.users u on u.id = s.owner_id
    where s.id = p_store_id
      and u.auth_user_id = (select auth.uid())
  );
$$;

-- ── owns_order(p_order_id bigint) ────────────────────────────────────────────
-- True when the current auth user is the customer or the store owner
-- of the given order.
-- Returns false for unauthenticated callers (auth.uid() → NULL propagates
-- through current_user_id() and current_store_id(), making both predicates
-- false via NULL ≠ any bigint).
-- Index-backed: orders_customer_id_idx, orders_store_id_idx,
--               stores_owner_id_idx, users_auth_user_id_idx.
create or replace function public.owns_order(p_order_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (
        o.customer_id = (select public.current_user_id())
        or o.store_id  = (select public.current_store_id())
      )
  );
$$;

-- ── has_role(p_role public.user_role) ─────────────────────────────────────────
-- True when the current auth user has exactly the given role in public.users.
-- Index-backed: users_auth_user_id_idx.
create or replace function public.has_role(p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where auth_user_id = (select auth.uid())
      and role = p_role
  );
$$;

-- ── orders_for_tienda ────────────────────────────────────────────────────────
-- Security-barrier view used by the tienda role to query their store's orders.
--
-- PRD §7.2: customer_location must not be exposed to tienda until the order
-- status is 'aceptado', 'en_camino', or 'finalizado'. Earlier statuses
-- ('enviado', 'recibido') and terminal rejection states ('rechazado',
-- 'cancelado', 'expirado') receive NULL for customer_location.
--
-- Row-level filtering is handled by the existing "orders: select" RLS policy
-- (B2.1). security_invoker = true preserves that policy for the calling user
-- (PostgreSQL 15+). security_barrier = true prevents planner predicate
-- pushdown that could bypass the CASE expression masking.
create or replace view public.orders_for_tienda
  with (security_barrier = true, security_invoker = true)
as
select
  o.id,
  o.public_id,
  o.store_id,
  o.customer_id,
  o.status,
  o.customer_note,
  o.store_note,
  case
    when o.status in ('aceptado', 'en_camino', 'finalizado')
    then o.customer_location
    else null
  end as customer_location,
  o.expires_at,
  o.created_at,
  o.updated_at
from public.orders o;
