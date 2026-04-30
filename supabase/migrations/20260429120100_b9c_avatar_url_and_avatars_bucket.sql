-- B9-C — Avatar de usuario.
--
-- 1. Add users.avatar_url (text, nullable). Sin default — UI muestra
--    iniciales/placeholder si está null.
-- 2. Create storage bucket 'avatars' (public read, 5 MB, jpg/png/webp).
-- 3. RLS policies sobre storage.objects: read libre, write/update/delete
--    sólo bajo prefix user-<auth.uid()>/.
--
-- Path convention: avatars/user-<auth_user_id>/<uuid>.<ext>
--
-- Skill rules: security-rls-basics, security-privileges,
--              security-rls-performance.

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema: avatar_url en users
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users add column if not exists avatar_url text;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket: avatars
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone (anon + authenticated) can read.
create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Authenticated user can insert under their own user-<auth.uid()>/ prefix.
-- (select auth.uid()) is evaluated once per query — skill rule
-- security-rls-performance.
create policy "avatars: user insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text
  );

create policy "avatars: user update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text
  );

create policy "avatars: user delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'user-' || (select auth.uid())::text
  );
