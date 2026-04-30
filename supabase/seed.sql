-- Seed data for local development.
-- Applied automatically after migrations during `pnpm supabase:reset`.
-- Keep idempotent: use INSERT ... ON CONFLICT DO NOTHING.
--
-- Fixed UUID ranges (prevent duplicate rows across resets):
--   Auth users   00000000-0000-0000-0000-00000000000{1-3}
--   Stores       10000000-0000-0000-0000-00000000000{1-5}
--   Products     20000000-0000-0000-0000-0000000000{01-20}
--   Orders       30000000-0000-0000-0000-00000000000{1-10}
--
-- Password for all dev accounts: Ambulante123!

-- app.settings.cron_secret and app.settings.site_url are intentionally NOT set here.
-- ALTER DATABASE SET requires superuser and is not supported in seeds or migrations
-- with this Supabase CLI version. internal.call_cron_endpoint() handles missing
-- settings gracefully via current_setting(..., true) (missing_ok = true).

-- ─────────────────────────────────────────────────────────────────────────────
-- Auth users
-- The on_auth_user_created trigger fires on INSERT → public.users rows are
-- created automatically with role and display_name from raw_user_meta_data.
-- ─────────────────────────────────────────────────────────────────────────────

insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'cliente@dev.ambulante.local',
    extensions.crypt('Ambulante123!', extensions.gen_salt('bf', 6)),
    now(),
    '{"display_name": "Ana García", "role": "cliente"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tienda@dev.ambulante.local',
    extensions.crypt('Ambulante123!', extensions.gen_salt('bf', 6)),
    now(),
    '{"display_name": "Carlos Méndez", "role": "tienda"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@dev.ambulante.local',
    extensions.crypt('Ambulante123!', extensions.gen_salt('bf', 6)),
    now(),
    '{"display_name": "Sistema Admin", "role": "admin"}'::jsonb,
    now(), now()
  )
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Stores — 5 zonas de CABA, todas bajo tienda@dev.ambulante.local
-- current_location: extensions.st_makepoint(lng, lat) — PostGIS es (X=lng, Y=lat)
-- ─────────────────────────────────────────────────────────────────────────────

-- Store 1: Palermo
insert into public.stores (
  public_id, owner_id, name, description, category, phone,
  available, tagline, price_from_ars, hours, current_location
)
select
  '10000000-0000-0000-0000-000000000001',
  id,
  'El Choripán de Pedro',
  'Los mejores choripanes de Palermo, con chimichurri casero y pan artesanal',
  'Comida argentina',
  '+5491155550001',
  true,
  'El clásico del barrio desde 2010',
  1500.00,
  'Lun–Vie 12–20hs · Sab 11–21hs',
  extensions.st_setsrid(extensions.st_makepoint(-58.4328, -34.5779), 4326)
from public.users where auth_user_id = '00000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- Store 2: San Telmo
insert into public.stores (
  public_id, owner_id, name, description, category, phone,
  available, tagline, price_from_ars, hours, current_location
)
select
  '10000000-0000-0000-0000-000000000002',
  id,
  'Sushi Ambulante',
  'Sushi fresco preparado al momento en el corazón de San Telmo',
  'Sushi',
  '+5491155550002',
  true,
  'Fusión japonesa en la calle',
  2800.00,
  'Mar–Dom 12–22hs',
  extensions.st_setsrid(extensions.st_makepoint(-58.3730, -34.6214), 4326)
from public.users where auth_user_id = '00000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- Store 3: Recoleta (fuera de servicio hoy)
insert into public.stores (
  public_id, owner_id, name, description, category, phone,
  available, tagline, price_from_ars, hours, current_location
)
select
  '10000000-0000-0000-0000-000000000003',
  id,
  'Helados Artesanales Nonna',
  'Helados artesanales con recetas de la nonna, en Recoleta',
  'Helados',
  '+5491155550003',
  false,
  'Recetas de familia desde 1985',
  1500.00,
  'Mié–Lun 13–21hs',
  extensions.st_setsrid(extensions.st_makepoint(-58.3975, -34.5875), 4326)
from public.users where auth_user_id = '00000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- Store 4: Villa Crespo
insert into public.stores (
  public_id, owner_id, name, description, category, phone,
  available, tagline, price_from_ars, hours, current_location
)
select
  '10000000-0000-0000-0000-000000000004',
  id,
  'Tacos & Burritos Express',
  'Comida mexicana auténtica con tortillas hechas a mano en Villa Crespo',
  'Comida mexicana',
  '+5491155550004',
  true,
  'Picante, sabroso y rápido',
  1500.00,
  'Lun–Dom 11–23hs',
  extensions.st_setsrid(extensions.st_makepoint(-58.4398, -34.5991), 4326)
from public.users where auth_user_id = '00000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- Store 5: Caballito (fuera de servicio hoy)
insert into public.stores (
  public_id, owner_id, name, description, category, phone,
  available, tagline, price_from_ars, hours, current_location
)
select
  '10000000-0000-0000-0000-000000000005',
  id,
  'Café en Ruedas',
  'Café de especialidad y medialunas recién horneadas en Caballito',
  'Cafetería',
  '+5491155550005',
  false,
  'Tu café de barrio sobre ruedas',
  800.00,
  'Lun–Vie 7–15hs',
  extensions.st_setsrid(extensions.st_makepoint(-58.4461, -34.6175), 4326)
from public.users where auth_user_id = '00000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Products — 4 por tienda = 20 total
-- ─────────────────────────────────────────────────────────────────────────────

-- Store 1: El Choripán de Pedro
insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000001', id, 'Choripán simple', 'Pan francés con chorizo criollo', 1500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000002', id, 'Choripán con chimichurri', 'Pan artesanal, chorizo y chimichurri casero', 1800.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000003', id, 'Morcipán', 'Pan con morcilla criolla a la plancha', 1600.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000004', id, 'Bondiola a la plancha', 'Bondiola de cerdo con mostaza y lechuga', 2200.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Store 2: Sushi Ambulante
insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000005', id, 'Nigiri salmón (6u)', 'Salmón noruego sobre arroz de sushi', 3500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000006', id, 'California roll (8u)', 'Palta, pepino y kani con nori por fuera', 2800.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000007', id, 'Temaki atún', 'Cono de nori con atún, palta y pepino', 2200.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000008', id, 'Edamame salado', 'Poroto de soja con sal marina', 1200.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000002'
on conflict (public_id) do nothing;

-- Store 3: Helados Artesanales Nonna
insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000009', id, 'Kilo chocolate', 'Chocolate belga artesanal, kilo', 4500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000003'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000010', id, 'Medio kilo frutilla', 'Frutilla de temporada, medio kilo', 2500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000003'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000011', id, '1/4 kilo vainilla', 'Vainilla de Madagascar, cuarto kilo', 1500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000003'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000012', id, 'Sundae especial', 'Copa con 3 gustos, crema y dulce de leche', 1800.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000003'
on conflict (public_id) do nothing;

-- Store 4: Tacos & Burritos Express
insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000013', id, 'Taco de pollo (3u)', 'Pollo al pastor con cebolla y cilantro', 2500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000004'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000014', id, 'Burrito de carne', 'Carne asada, arroz, frijoles y guacamole', 2800.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000004'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000015', id, 'Guacamole con chips', 'Guacamole casero con totopos artesanales', 1500.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000004'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000016', id, 'Nachos con cheddar', 'Nachos crocantes con salsa cheddar y jalapeños', 2000.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000004'
on conflict (public_id) do nothing;

-- Store 5: Café en Ruedas
insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000017', id, 'Café americano', 'Single origin, método filtrado', 800.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000005'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000018', id, 'Latte', 'Espresso doble con leche vaporizada', 1100.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000005'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000019', id, 'Medialunas (3u)', 'Medialunas de manteca recién horneadas', 1200.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000005'
on conflict (public_id) do nothing;

insert into public.products (public_id, store_id, name, description, price, available)
select '20000000-0000-0000-0000-000000000020', id, 'Tostado mixto', 'Pan de masa madre con jamón y queso fundido', 1600.00, true
from public.stores where public_id = '10000000-0000-0000-0000-000000000005'
on conflict (public_id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders — 10 pedidos en distintos estados (todos de cliente@dev.ambulante.local)
-- customer_location: null hasta ACEPTADO (PRD §7.2 — privacidad de ubicación)
-- ─────────────────────────────────────────────────────────────────────────────

-- Order 1: ENVIADO — esperando respuesta de la tienda 1
insert into public.orders (public_id, store_id, customer_id, status, customer_note, expires_at)
select
  '30000000-0000-0000-0000-000000000001',
  s.id,
  c.id,
  'enviado',
  'Sin chimichurri, por favor',
  now() + interval '10 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000001'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 2: RECIBIDO — tienda lo vio, aún no respondió
insert into public.orders (public_id, store_id, customer_id, status, customer_note, expires_at)
select
  '30000000-0000-0000-0000-000000000002',
  s.id,
  c.id,
  'recibido',
  'Para comer acá mismo',
  now() + interval '8 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000002'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 3: ACEPTADO — tienda aceptó, cliente tiene ubicación visible
insert into public.orders (
  public_id, store_id, customer_id, status, customer_note,
  customer_location, expires_at
)
select
  '30000000-0000-0000-0000-000000000003',
  s.id,
  c.id,
  'aceptado',
  'Llego en 5 minutos',
  extensions.st_setsrid(extensions.st_makepoint(-58.4310, -34.5795), 4326),
  now() + interval '2 hours'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000001'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 4: EN_CAMINO — cliente en camino a tienda 4
insert into public.orders (
  public_id, store_id, customer_id, status, customer_note,
  customer_location, expires_at
)
select
  '30000000-0000-0000-0000-000000000004',
  s.id,
  c.id,
  'en_camino',
  'Voy llegando',
  extensions.st_setsrid(extensions.st_makepoint(-58.4380, -34.6005), 4326),
  now() + interval '90 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000004'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 5: FINALIZADO — completado en tienda 3 (Recoleta)
insert into public.orders (
  public_id, store_id, customer_id, status,
  customer_location, expires_at
)
select
  '30000000-0000-0000-0000-000000000005',
  s.id,
  c.id,
  'finalizado',
  extensions.st_setsrid(extensions.st_makepoint(-58.3960, -34.5890), 4326),
  now() - interval '1 hour'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000003'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 6: RECHAZADO — tienda 2 no tenía ingredientes
insert into public.orders (public_id, store_id, customer_id, status, customer_note, store_note, expires_at)
select
  '30000000-0000-0000-0000-000000000006',
  s.id,
  c.id,
  'rechazado',
  '2 California rolls y 1 edamame',
  'Sin existencias de kani hoy, disculpá',
  now() - interval '30 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000002'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 7: CANCELADO — cliente canceló antes de que acepten
insert into public.orders (
  public_id, store_id, customer_id, status, customer_note,
  cancelled_at, cancel_reason, expires_at
)
select
  '30000000-0000-0000-0000-000000000007',
  s.id,
  c.id,
  'cancelado',
  '3 tacos de pollo',
  now() - interval '45 minutes',
  'Me cambié de lugar, no llego',
  now() - interval '40 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000004'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 8: EXPIRADO — tienda 5 no respondió en 10 min
insert into public.orders (public_id, store_id, customer_id, status, customer_note, expires_at)
select
  '30000000-0000-0000-0000-000000000008',
  s.id,
  c.id,
  'expirado',
  '2 lattes y 3 medialunas',
  now() - interval '5 minutes'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000005'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 9: ACEPTADO — segundo pedido activo en tienda 1
insert into public.orders (
  public_id, store_id, customer_id, status, customer_note,
  customer_location, expires_at
)
select
  '30000000-0000-0000-0000-000000000009',
  s.id,
  c.id,
  'aceptado',
  'Con todo, gracias',
  extensions.st_setsrid(extensions.st_makepoint(-58.4340, -34.5783), 4326),
  now() + interval '2 hours'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000001'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- Order 10: FINALIZADO — completado en tienda 2 (San Telmo)
insert into public.orders (
  public_id, store_id, customer_id, status,
  customer_location, expires_at
)
select
  '30000000-0000-0000-0000-000000000010',
  s.id,
  c.id,
  'finalizado',
  extensions.st_setsrid(extensions.st_makepoint(-58.3720, -34.6220), 4326),
  now() - interval '2 hours'
from
  public.stores s,
  public.users c
where s.public_id = '10000000-0000-0000-0000-000000000002'
  and c.auth_user_id = '00000000-0000-0000-0000-000000000001'
on conflict (public_id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Order items — snapshot del producto al momento de la orden
-- product_snapshot contiene name, description y price para preservarlos aunque
-- el producto sea editado o eliminado posteriormente (PRD §7.4).
--
-- Idempotency: delete-then-reinsert en lugar de NOT EXISTS (que es no-atómico
-- y puede duplicar bajo ejecuciones concurrentes). Borramos primero los items
-- de las órdenes seed (identificadas por public_id fijo) y reinsertamos.
-- ─────────────────────────────────────────────────────────────────────────────

delete from public.order_items
where order_id in (
  select id from public.orders
  where public_id in (
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000010'
  )
);

-- Order 1 (enviado, tienda 1): choripán simple
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  2,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000001'
  and p.public_id = '20000000-0000-0000-0000-000000000001';

-- Order 2 (recibido, tienda 2): nigiri salmón + edamame
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000002'
  and p.public_id = '20000000-0000-0000-0000-000000000005';

insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000002'
  and p.public_id = '20000000-0000-0000-0000-000000000008';

-- Order 3 (aceptado, tienda 1): choripán chimichurri + morcipán
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000003'
  and p.public_id = '20000000-0000-0000-0000-000000000002';

insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000003'
  and p.public_id = '20000000-0000-0000-0000-000000000003';

-- Order 4 (en_camino, tienda 4): burrito + guacamole
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000004'
  and p.public_id = '20000000-0000-0000-0000-000000000014';

insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000004'
  and p.public_id = '20000000-0000-0000-0000-000000000015';

-- Order 5 (finalizado, tienda 3): kilo chocolate
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000005'
  and p.public_id = '20000000-0000-0000-0000-000000000009';

-- Order 6 (rechazado, tienda 2): california rolls x2 + edamame
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  2,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000006'
  and p.public_id = '20000000-0000-0000-0000-000000000006';

insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000006'
  and p.public_id = '20000000-0000-0000-0000-000000000008';

-- Order 7 (cancelado, tienda 4): tacos de pollo x3
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  3,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000007'
  and p.public_id = '20000000-0000-0000-0000-000000000013';

-- Order 8 (expirado, tienda 5): latte x2 + medialunas
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  2,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000008'
  and p.public_id = '20000000-0000-0000-0000-000000000018';

insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000008'
  and p.public_id = '20000000-0000-0000-0000-000000000019';

-- Order 9 (aceptado, tienda 1): bondiola a la plancha
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  1,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000009'
  and p.public_id = '20000000-0000-0000-0000-000000000004';

-- Order 10 (finalizado, tienda 2): temaki atún x2
insert into public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
select
  o.id,
  p.id,
  jsonb_build_object('name', p.name, 'description', p.description, 'price', p.price),
  2,
  p.price
from public.orders o, public.products p
where o.public_id = '30000000-0000-0000-0000-000000000010'
  and p.public_id = '20000000-0000-0000-0000-000000000007';
