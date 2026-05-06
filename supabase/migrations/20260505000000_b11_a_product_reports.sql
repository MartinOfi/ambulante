-- B11-A — product_reports + stores.rejection_reason + admin RLS
--
-- 1. Add rejection_reason column to stores (nullable — only set on rejection).
-- 2. Recreate stores_view to expose rejection_reason.
-- 3. Add admin update RLS for stores (validation approve/reject workflow).
-- 4. Create product_reports table with indexes and RLS.
-- 5. Add admin update RLS for products (content removal workflow).
--
-- Skill rules applied: schema-primary-keys (HIGH), schema-foreign-key-indexes (HIGH),
-- schema-constraints (HIGH), data-pagination (composite status+date index).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. rejection_reason column
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.stores
  add column if not exists rejection_reason text null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Update stores_view (add rejection_reason; preserves all prior columns)
-- ─────────────────────────────────────────────────────────────────────────────

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
  s.rejection_reason,
  extensions.st_y(s.current_location::extensions.geometry) as lat,
  extensions.st_x(s.current_location::extensions.geometry) as lng,
  s.created_at,
  s.updated_at
from public.stores s
join public.users u on u.id = s.owner_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Admin update policy for stores (approve / reject validation)
-- ─────────────────────────────────────────────────────────────────────────────

create policy "stores: admin update"
  on public.stores for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. product_reports
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.product_reports (
  id           bigint generated always as identity primary key,
  public_id    uuid        not null default gen_random_uuid(),
  product_id   bigint      not null,
  reported_by  bigint      not null,
  reason       text        not null check (reason in ('INAPPROPRIATE', 'SPAM', 'MISLEADING', 'OTHER')),
  status       text        not null default 'PENDING' check (status in ('PENDING', 'RESOLVED', 'DISMISSED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reports_public_id_key'
      and conrelid = 'public.product_reports'::regclass
  ) then
    alter table public.product_reports
      add constraint product_reports_public_id_key unique (public_id);
  end if;
end $$;

create index if not exists product_reports_public_id_idx
  on public.product_reports (public_id);

-- FK: product_id → products.id  (cascade: report deleted when product is deleted)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reports_product_id_fkey'
      and conrelid = 'public.product_reports'::regclass
  ) then
    alter table public.product_reports
      add constraint product_reports_product_id_fkey
      foreign key (product_id) references public.products (id) on delete cascade;
  end if;
end $$;

create index if not exists product_reports_product_id_idx
  on public.product_reports (product_id);

-- FK: reported_by → users.id  (restrict: preserve audit trail even if user deleted)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reports_reported_by_fkey'
      and conrelid = 'public.product_reports'::regclass
  ) then
    alter table public.product_reports
      add constraint product_reports_reported_by_fkey
      foreign key (reported_by) references public.users (id) on delete restrict;
  end if;
end $$;

create index if not exists product_reports_reported_by_idx
  on public.product_reports (reported_by);

-- Composite index for the admin moderation queue (filter by status, ordered by date).
-- Covers: listReports(status='PENDING') ORDER BY created_at DESC.
create index if not exists product_reports_status_created_at_idx
  on public.product_reports (status, created_at desc);

drop trigger if exists trg_product_reports_updated_at on public.product_reports;
create trigger trg_product_reports_updated_at
  before update on public.product_reports
  for each row execute function public.set_updated_at();

alter table public.product_reports enable row level security;

-- Admin: read the full moderation queue
create policy "product_reports: admin select"
  on public.product_reports for select
  to authenticated
  using ((select public.is_admin()));

-- Admin: resolve or dismiss reports
create policy "product_reports: admin update"
  on public.product_reports for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Cliente: can file a report against any product
create policy "product_reports: client insert"
  on public.product_reports for insert
  to authenticated
  with check (
    reported_by = (select public.current_user_id())
    and (select public.has_role('cliente'))
  );

-- Cliente: can read their own submitted reports
create policy "product_reports: client read own"
  on public.product_reports for select
  to authenticated
  using (reported_by = (select public.current_user_id()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Admin update policy for products (content removal)
-- ─────────────────────────────────────────────────────────────────────────────

create policy "products: admin update"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
