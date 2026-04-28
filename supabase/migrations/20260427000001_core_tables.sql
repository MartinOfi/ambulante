-- B1.2 — Core domain tables for Ambulante.
-- Rules applied: schema-primary-keys (HIGH), schema-data-types (HIGH),
-- schema-constraints (HIGH), schema-foreign-key-indexes (HIGH).

-- ─────────────────────────────────────────────────────────────────────────────
-- Custom enum types (idempotent via DO block)
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.user_role as enum ('cliente', 'tienda', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'enviado', 'recibido', 'aceptado', 'en_camino',
    'finalizado', 'rechazado', 'cancelado', 'expirado'
  );
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- set_updated_at() trigger function (shared by all mutable tables)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id             bigint generated always as identity primary key,
  public_id      uuid        not null default gen_random_uuid(),
  auth_user_id   uuid        not null,
  role           public.user_role not null default 'cliente',
  display_name   text        not null,
  phone          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_public_id_key' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_public_id_key unique (public_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_auth_user_id_key' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_auth_user_id_key unique (auth_user_id);
  end if;
end $$;

create index if not exists users_public_id_idx    on public.users (public_id);
create index if not exists users_auth_user_id_idx on public.users (auth_user_id);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- stores
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.stores (
  id               bigint generated always as identity primary key,
  public_id        uuid        not null default gen_random_uuid(),
  owner_id         bigint      not null,
  name             text        not null,
  description      text,
  category         text,
  phone            text,
  available        boolean     not null default false,
  -- denormalized last-known location for fast map queries (updated by store_locations trigger)
  current_location geometry(Point, 4326),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stores_public_id_key' and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores add constraint stores_public_id_key unique (public_id);
  end if;
end $$;

create index if not exists stores_public_id_idx on public.stores (public_id);

-- FK: stores.owner_id → users.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stores_owner_id_fkey' and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint stores_owner_id_fkey
      foreign key (owner_id) references public.users (id) on delete restrict;
  end if;
end $$;

create index if not exists stores_owner_id_idx on public.stores (owner_id);

drop trigger if exists trg_stores_updated_at on public.stores;
create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.products (
  id           bigint generated always as identity primary key,
  public_id    uuid           not null default gen_random_uuid(),
  store_id     bigint         not null,
  name         text           not null,
  description  text,
  price        numeric(10, 2) not null check (price >= 0),
  currency     text           not null default 'ARS',
  available    boolean        not null default true,
  sku          text,
  image_url    text,
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_public_id_key' and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_public_id_key unique (public_id);
  end if;
end $$;

create index if not exists products_public_id_idx on public.products (public_id);

-- FK: products.store_id → stores.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_store_id_fkey' and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_store_id_fkey
      foreign key (store_id) references public.stores (id) on delete cascade;
  end if;
end $$;

create index if not exists products_store_id_idx on public.products (store_id);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id                bigint             generated always as identity primary key,
  public_id         uuid               not null default gen_random_uuid(),
  store_id          bigint             not null,
  customer_id       bigint             not null,
  status            public.order_status not null default 'enviado',
  customer_note     text,
  store_note        text,
  customer_location geometry(Point, 4326),
  expires_at        timestamptz,
  created_at        timestamptz        not null default now(),
  updated_at        timestamptz        not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_public_id_key' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders add constraint orders_public_id_key unique (public_id);
  end if;
end $$;

create index if not exists orders_public_id_idx on public.orders (public_id);

-- FK: orders.store_id → stores.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_store_id_fkey' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_store_id_fkey
      foreign key (store_id) references public.stores (id) on delete restrict;
  end if;
end $$;

create index if not exists orders_store_id_idx on public.orders (store_id);

-- FK: orders.customer_id → users.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_customer_id_fkey' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_customer_id_fkey
      foreign key (customer_id) references public.users (id) on delete restrict;
  end if;
end $$;

create index if not exists orders_customer_id_idx on public.orders (customer_id);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- order_items  (append-only — no updated_at, no update trigger)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.order_items (
  id               bigint         generated always as identity primary key,
  order_id         bigint         not null,
  -- nullable: set to NULL when product is deleted; snapshot is source of truth
  product_id       bigint,
  product_snapshot jsonb          not null,
  quantity         int            not null check (quantity > 0),
  unit_price       numeric(10, 2) not null check (unit_price >= 0),
  created_at       timestamptz    not null default now()
);

-- FK: order_items.order_id → orders.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_order_id_fkey' and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_order_id_fkey
      foreign key (order_id) references public.orders (id) on delete cascade;
  end if;
end $$;

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- FK: order_items.product_id → products.id (soft — nullable, set null on delete)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_product_id_fkey' and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_product_id_fkey
      foreign key (product_id) references public.products (id) on delete set null;
  end if;
end $$;

create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- store_locations  (append-only — no updated_at, no update trigger)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.store_locations (
  id              bigint         generated always as identity primary key,
  store_id        bigint         not null,
  location        geometry(Point, 4326) not null,
  accuracy_meters numeric,
  recorded_at     timestamptz    not null default now()
);

-- FK: store_locations.store_id → stores.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'store_locations_store_id_fkey' and conrelid = 'public.store_locations'::regclass
  ) then
    alter table public.store_locations
      add constraint store_locations_store_id_fkey
      foreign key (store_id) references public.stores (id) on delete cascade;
  end if;
end $$;

create index if not exists store_locations_store_id_idx on public.store_locations (store_id);
create index if not exists store_locations_recorded_at_idx on public.store_locations (recorded_at desc);

-- Sync denormalized current_location on stores whenever a new location is inserted
create or replace function public.sync_store_current_location()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stores
  set current_location = new.location
  where id = new.store_id;
  return new;
end;
$$;

drop trigger if exists trg_store_locations_sync on public.store_locations;
create trigger trg_store_locations_sync
  after insert on public.store_locations
  for each row execute function public.sync_store_current_location();

-- ─────────────────────────────────────────────────────────────────────────────
-- push_subscriptions
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id          bigint      generated always as identity primary key,
  user_id     bigint      not null,
  endpoint    text        not null,
  p256dh      text        not null,
  auth_key    text        not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'push_subscriptions_endpoint_key' and conrelid = 'public.push_subscriptions'::regclass
  ) then
    alter table public.push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);
  end if;
end $$;

-- FK: push_subscriptions.user_id → users.id
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'push_subscriptions_user_id_fkey' and conrelid = 'public.push_subscriptions'::regclass
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end $$;

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
-- push_subscriptions_endpoint_key UNIQUE constraint already creates an implicit index on endpoint

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- audit_log  (append-only — no updated_at, no update trigger)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.audit_log (
  id          bigint      generated always as identity primary key,
  table_name  text        not null,
  operation   text        not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id      bigint      not null,
  old_values  jsonb,
  new_values  jsonb,
  -- soft reference: actor_id may reference a deleted user — intentionally not an FK
  actor_id    bigint,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_table_row_idx  on public.audit_log (table_name, row_id);
create index if not exists audit_log_actor_idx      on public.audit_log (actor_id);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
