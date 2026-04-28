-- B1.4 — Partial indexes to minimize index size for selective predicates.

-- Active stores map: only index stores that are currently available
-- Supports PostGIS radius queries on the map screen — most stores are inactive
create index if not exists stores_current_location_active_gist_idx
  on public.stores using gist (current_location)
  where available = true and current_location is not null;

-- Pending order inbox: only index orders awaiting store action
-- Supports the real-time inbox query — terminal statuses are historical reads
create index if not exists orders_pending_created_idx
  on public.orders (created_at desc)
  where status in ('enviado', 'recibido');

-- SKU lookup: only index products that have a SKU set
-- Supports optional SKU search — NULL SKUs should never appear in results
create index if not exists products_sku_partial_idx
  on public.products (sku)
  where sku is not null;
