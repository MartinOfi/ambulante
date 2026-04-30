-- B10-A review fixes: add cuit column + update stores_view
--
-- 1. Add cuit column to stores (nullable — existing stores pre-date this requirement).
-- 2. Recreate stores_view to expose cuit and validation_status so the repository
--    and the admin panel can read them after INSERT.

-- 1. cuit column
alter table public.stores
  add column if not exists cuit varchar(11) null;

-- 2. Update stores_view to expose cuit and validation_status
--    (security_invoker = true, security_barrier = true preserved from original).
create or replace view public.stores_view
  with (security_invoker = true, security_barrier = true)
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
  extensions.st_y(s.current_location::extensions.geometry) as lat,
  extensions.st_x(s.current_location::extensions.geometry) as lng,
  s.created_at,
  s.updated_at
from public.stores s
join public.users u on u.id = s.owner_id;
