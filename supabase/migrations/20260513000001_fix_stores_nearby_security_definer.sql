-- Fix: find_stores_nearby security definer + stores_view explicit WHERE
--
-- Root cause: both find_stores_nearby (security invoker) and stores_view
-- (security_invoker = true) do an INNER JOIN to public.users. The
-- "users: select" RLS policy only allows a user to read their own row
-- (auth_user_id = auth.uid()). When a client calls the function or view,
-- the JOIN finds no matching users row for the store owner, the INNER JOIN
-- eliminates all stores, and the result is [].
--
-- Fixes:
--   1. find_stores_nearby → security definer + explicit s.available = true
--      (security definer bypasses RLS so the JOIN works; the explicit filter
--       enforces the business rule that was previously enforced by RLS).
--   2. stores_view → drop security_invoker (runs as view owner, bypasses RLS);
--      keep security_barrier = true; add explicit WHERE clause that replicates
--      the stores:select RLS policy so clients see only available stores and
--      owners see only their own store.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. find_stores_nearby — security definer + available filter
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.find_stores_nearby(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_meters  double precision
)
returns table (
  public_id        uuid,
  owner_public_id  uuid,
  name             text,
  description      text,
  category         text,
  available        boolean,
  photo_url        text,
  tagline          text,
  price_from_ars   numeric,
  hours            text,
  lat              double precision,
  lng              double precision,
  distance_meters  double precision
)
language sql
security definer
set search_path = ''
as $$
  select
    s.public_id,
    u.public_id                                               as owner_public_id,
    s.name,
    s.description,
    s.category,
    s.available,
    s.photo_url,
    s.tagline,
    s.price_from_ars,
    s.hours,
    extensions.st_y(s.current_location::extensions.geometry) as lat,
    extensions.st_x(s.current_location::extensions.geometry) as lng,
    extensions.st_distance(
      s.current_location::extensions.geometry::extensions.geography,
      extensions.st_point(p_lng, p_lat)::extensions.geography
    )                                                         as distance_meters
  from public.stores s
  join public.users u on u.id = s.owner_id
  where s.current_location is not null
    and s.available = true
    and extensions.st_dwithin(
      s.current_location::extensions.geometry::extensions.geography,
      extensions.st_point(p_lng, p_lat)::extensions.geography,
      p_radius_meters
    )
  order by distance_meters
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. stores_view — drop security_invoker, add explicit WHERE
--
-- Without security_invoker the view runs as its owner (postgres), which
-- bypasses RLS on the underlying tables. The WHERE clause below replicates
-- the stores:select RLS policy so the view is still safe:
--   - available stores are visible to everyone (public map)
--   - a store owner always sees their own store (dashboard / edit flows)
--   - admins see all stores (moderation)
--
-- auth.uid() reads from the JWT session context and works correctly inside
-- a non-security-invoker view; it is not affected by the view owner's role.
-- ─────────────────────────────────────────────────────────────────────────────

drop view if exists public.stores_view;

create view public.stores_view
  with (security_barrier = true)
as
select
  s.id,
  s.public_id,
  s.owner_id,
  u.public_id  as owner_public_id,
  s.name,
  s.description,
  s.category,
  s.available,
  s.photo_url,
  s.tagline,
  s.price_from_ars,
  s.hours,
  s.cuit,
  s.validation_status,
  s.rejection_reason,
  extensions.st_y(s.current_location::extensions.geometry) as lat,
  extensions.st_x(s.current_location::extensions.geometry) as lng,
  s.created_at,
  s.updated_at
from public.stores s
join public.users u on u.id = s.owner_id
where
  s.available = true
  or s.owner_id = (
    select id from public.users u2
    where u2.auth_user_id = (select auth.uid())
  )
  or (select public.is_admin());
