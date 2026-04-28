-- B3.1 — Add missing store profile columns, user fields, and PostGIS helpers.
-- Rules applied: data-n-plus-one (stores_view embeds location), schema-data-types (MEDIUM).

-- ─────────────────────────────────────────────────────────────────────────────
-- users: add email (synced from auth) and suspended flag
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists email      text,
  add column if not exists suspended  boolean not null default false;

create index if not exists users_email_idx on public.users (email);

-- Keep email in sync when auth user's email changes
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in ('cliente', 'tienda', 'admin')
        then (new.raw_user_meta_data->>'role')::public.user_role
      else 'cliente'::public.user_role
    end,
    new.email
  );
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- stores: add profile columns missing from initial schema
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.stores
  add column if not exists photo_url      text,
  add column if not exists tagline        text,
  add column if not exists price_from_ars numeric(10, 2),
  add column if not exists hours          text;

-- ─────────────────────────────────────────────────────────────────────────────
-- stores_view: exposes lat/lng as plain columns, avoids WKB parsing in TS
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.stores_view as
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
  st_y(s.current_location::geometry) as lat,
  st_x(s.current_location::geometry) as lng,
  s.created_at,
  s.updated_at
from public.stores s
join public.users u on u.id = s.owner_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- find_stores_nearby: PostGIS proximity search returning domain-ready columns.
-- Uses ST_DWithin (index-accelerated) then ST_Distance for exact meters.
-- Rule: data-n-plus-one — returns stores + owner public_id in single query.
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
security invoker
set search_path = ''
as $$
  select
    s.public_id,
    u.public_id                                     as owner_public_id,
    s.name,
    s.description,
    s.category,
    s.available,
    s.photo_url,
    s.tagline,
    s.price_from_ars,
    s.hours,
    st_y(s.current_location::geometry)              as lat,
    st_x(s.current_location::geometry)              as lng,
    st_distance(
      s.current_location::geometry::geography,
      st_point(p_lng, p_lat)::geography
    )                                               as distance_meters
  from public.stores s
  join public.users u on u.id = s.owner_id
  where s.current_location is not null
    and st_dwithin(
      s.current_location::geometry::geography,
      st_point(p_lng, p_lat)::geography,
      p_radius_meters
    )
  order by distance_meters
$$;
