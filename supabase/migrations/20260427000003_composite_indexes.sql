-- B1.3 — Composite and GIST indexes for common query patterns.

-- Store inbox (filter by store+status) and history (filter by store, sort by date)
create index if not exists orders_store_status_created_idx
  on public.orders (store_id, status, created_at desc);

-- Client order history: filter by customer, sort by created_at
create index if not exists orders_customer_created_idx
  on public.orders (customer_id, created_at desc);

-- Store catalog: filter by store and availability
create index if not exists products_store_available_idx
  on public.products (store_id, available);

-- PostGIS radius queries on historical location data
create index if not exists store_locations_location_gist_idx
  on public.store_locations using gist (location);
