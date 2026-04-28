-- B5.1 — Storage buckets + RLS policies.
-- Rules applied: security-rls-basics (CRITICAL), security-privileges (MEDIUM).
--
-- Bucket layout:
--   products        — public read; tienda writes only under store-<id>/ prefix; 5 MB limit.
--   store-logos     — public read; tienda writes only under store-<id>/ prefix; 5 MB limit.
--   validation-docs — private;    tienda writes under store-<id>/; admin reads all; 10 MB limit.
--
-- Path convention: <bucket>/<store-{store_id}>/<filename>
-- (select public.current_store_id()) is evaluated once per query — not per row.

-- ─────────────────────────────────────────────────────────────────────────────
-- Buckets
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'products',
    'products',
    true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'store-logos',
    'store-logos',
    true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'validation-docs',
    'validation-docs',
    false,
    10485760,  -- 10 MB
    array['image/jpeg', 'image/png', 'application/pdf']
  )
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket: products
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone (including anon) can read objects.
create policy "products: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');

-- Authenticated tienda can insert under their own store-<id>/ prefix.
create policy "products: store owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- Authenticated tienda can update objects under their own prefix.
create policy "products: store owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'products'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  )
  with check (
    bucket_id = 'products'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- Authenticated tienda can delete objects under their own prefix.
create policy "products: store owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'products'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket: store-logos
-- ─────────────────────────────────────────────────────────────────────────────

create policy "store-logos: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-logos');

create policy "store-logos: store owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-logos'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

create policy "store-logos: store owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-logos'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  )
  with check (
    bucket_id = 'store-logos'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

create policy "store-logos: store owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-logos'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket: validation-docs  (private — no public select)
-- ─────────────────────────────────────────────────────────────────────────────

-- Admin can read all validation documents.
create policy "validation-docs: admin read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'validation-docs'
    and (select public.is_admin())
  );

-- Tienda can read its own documents (to allow re-upload UX).
create policy "validation-docs: store owner read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'validation-docs'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- Tienda can upload its own documents.
create policy "validation-docs: store owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'validation-docs'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- Tienda can replace (update) its own documents.
create policy "validation-docs: store owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'validation-docs'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  )
  with check (
    bucket_id = 'validation-docs'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );

-- Tienda can delete its own documents.
create policy "validation-docs: store owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'validation-docs'
    and (select public.current_store_id()) is not null
    and name like 'store-' || (select public.current_store_id()) || '/%'
  );
