-- Enable Supabase Realtime for the tables that drive live UI updates:
--   orders        → order status changes (client tracks their order in real time)
--   store_locations → vendor position updates (map refreshes without polling)
--   stores        → availability flag (clients see when a store goes online/offline)
--
-- REPLICA IDENTITY FULL is required so that row-level filters on UPDATE and DELETE
-- events (e.g. channel = 'orders:id=eq.<uuid>') can match against the full old row,
-- not just the primary key.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.store_locations;
alter publication supabase_realtime add table public.stores;

alter table public.orders          replica identity full;
alter table public.store_locations replica identity full;
alter table public.stores          replica identity full;
