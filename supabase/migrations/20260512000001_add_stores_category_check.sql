-- Enforce valid StoreKind values on stores.category.
-- Prior to this migration, the column accepted any string; the seed data had
-- free-form Spanish strings ('Comida argentina', 'Sushi', etc.) that broke the
-- TS mapper at runtime. The UPDATE below fixes any existing bad rows before
-- the constraint is added.

update public.stores
set category = 'food-truck'
where category not in ('food-truck', 'street-cart', 'ice-cream');

alter table public.stores
  add constraint stores_category_valid
  check (category in ('food-truck', 'street-cart', 'ice-cream'));
