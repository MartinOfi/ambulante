-- Fix current_store_id() non-determinism.
--
-- Previously: LIMIT 1 without ORDER BY — non-deterministic when a user owns multiple stores.
-- This caused flaky RLS failures on products INSERT/UPDATE/DELETE and orders SELECT
-- whenever the planner returned a store other than the one used by /api/store/me.
--
-- Fix: add ORDER BY s.id ASC so the lowest-bigint-id store is always returned,
-- consistent with SupabaseStoreRepository.findByOwnerId (ORDER BY id ASC LIMIT 1).

create or replace function public.current_store_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select s.id
  from public.stores s
  join public.users u on u.id = s.owner_id
  where u.auth_user_id = (select auth.uid())
  order by s.id asc
  limit 1;
$$;
