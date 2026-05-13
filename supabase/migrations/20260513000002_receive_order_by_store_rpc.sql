-- B10-C-ext — receive_order_by_store: ENVIADO → RECIBIDO (WhatsApp-style "seen" mechanic).
--
-- Called automatically when the store opens the order detail page (Server Component).
-- Guarantees:
--   • security definer + set search_path = ''
--   • (select auth.uid()) evaluated once
--   • SELECT … FOR UPDATE on orders row
--   • Store ownership enforced: auth.uid() → users → stores → order.store_id
--   • Idempotent: already-RECIBIDO returns ok=true (safe for browser back navigation)
--
-- Returns:
--   { ok: true,  publicId: <uuid> }
--   { ok: false, error: 'unauthenticated' }
--   { ok: false, error: 'not_found' }
--   { ok: false, error: 'invalid_transition', currentStatus: <text> }

create or replace function public.receive_order_by_store(p_public_id uuid)
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

  -- Lock the row to serialize concurrent attempts.
  -- The store_id filter doubles as the ownership check.
  select id, status into v_order_id, v_status
  from public.orders
  where public_id = p_public_id
    and store_id  = v_store_id
  for update;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Idempotent: store navigating back to an already-received order must not error.
  if v_status = 'recibido' then
    return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
  end if;

  if v_status <> 'enviado' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status      = 'recibido',
      received_at = now(),
      updated_at  = now()
  where id = v_order_id;

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute on function public.receive_order_by_store(uuid) to authenticated;
