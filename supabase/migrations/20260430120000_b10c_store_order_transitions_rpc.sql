-- B10-C — Store order state transitions: accept / reject / finalize.
--
-- Three RPCs called from Server Actions (skill rule lock-short-transactions):
--   accept_order_by_store   RECIBIDO  → ACEPTADO
--   reject_order_by_store   RECIBIDO  → RECHAZADO
--   finalize_order_by_store EN_CAMINO → FINALIZADO
--
-- All three share the same guarantees:
--   • security definer + set search_path = '' (skill rule security-privileges)
--   • (select auth.uid()) evaluated once   (skill rule security-rls-performance)
--   • SELECT … FOR UPDATE on orders row    (skill rule lock-short-transactions)
--   • Store ownership enforced explicitly:
--       auth.uid() → users.auth_user_id → users.id → stores.owner_id
--     (RLS is bypassed by security definer; we replicate the check in PL/pgSQL)
--
-- Returns discriminated JSONB:
--   { ok: true,  publicId: <uuid> }
--   { ok: false, error: 'unauthenticated' }
--   { ok: false, error: 'not_found' }
--   { ok: false, error: 'invalid_transition', currentStatus: <text> }

-- ─────────────────────────────────────────────────────────────────────────────
-- accept_order_by_store
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.accept_order_by_store(p_public_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_uid uuid;
  v_user_id  bigint;
  v_store_id bigint;
  v_order_id bigint;
  v_status   public.order_status;
begin
  v_auth_uid := (select auth.uid());
  if v_auth_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_user_id
  from public.users
  where auth_user_id = v_auth_uid;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  -- LIMIT 1 guards against TOO_MANY_ROWS if the no-UNIQUE invariant is ever violated.
  select id into v_store_id
  from public.stores
  where owner_id = v_user_id
  order by id
  limit 1;

  if v_store_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  -- Lock the row to serialize concurrent attempts (skill rule lock-short-transactions).
  -- The store_id filter doubles as the ownership check.
  select id, status into v_order_id, v_status
  from public.orders
  where public_id = p_public_id
    and store_id  = v_store_id
  for update;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_status <> 'recibido' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status     = 'aceptado',
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute on function public.accept_order_by_store(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- reject_order_by_store
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.reject_order_by_store(p_public_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_uid uuid;
  v_user_id  bigint;
  v_store_id bigint;
  v_order_id bigint;
  v_status   public.order_status;
begin
  v_auth_uid := (select auth.uid());
  if v_auth_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_user_id
  from public.users
  where auth_user_id = v_auth_uid;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_store_id
  from public.stores
  where owner_id = v_user_id
  order by id
  limit 1;

  if v_store_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id, status into v_order_id, v_status
  from public.orders
  where public_id = p_public_id
    and store_id  = v_store_id
  for update;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_status <> 'recibido' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status     = 'rechazado',
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute on function public.reject_order_by_store(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- finalize_order_by_store
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.finalize_order_by_store(p_public_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_uid uuid;
  v_user_id  bigint;
  v_store_id bigint;
  v_order_id bigint;
  v_status   public.order_status;
begin
  v_auth_uid := (select auth.uid());
  if v_auth_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_user_id
  from public.users
  where auth_user_id = v_auth_uid;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_store_id
  from public.stores
  where owner_id = v_user_id
  order by id
  limit 1;

  if v_store_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id, status into v_order_id, v_status
  from public.orders
  where public_id = p_public_id
    and store_id  = v_store_id
  for update;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- PRD §7.1: finalize only valid from EN_CAMINO (customer confirmed they are on the way).
  if v_status <> 'en_camino' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status     = 'finalizado',
      updated_at = now()
  where id = v_order_id;

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute on function public.finalize_order_by_store(uuid) to authenticated;
