-- B11-B — Audit log writes wired into order-transition RPCs.
--
-- Each of the four RPCs (accept/reject/finalize by store, cancel by customer)
-- now inserts an audit_log row in the same transaction as the orders UPDATE.
-- The INSERT is placed after the UPDATE and before the final RETURN so that:
--   • A write failure rolls back both the status change and the audit entry.
--   • The trigger added in 20260505000001 can never fire here (INSERT, not UPDATE/DELETE).
--
-- new_values JSONB columns match what SupabaseAuditLogService.findByOrderId() reads:
--   orderId, actor, eventType, fromStatus, toStatus, occurredAt
--
-- actor_id = v_user_id (tienda flows) / v_customer_internal_id (cancel flow).
-- old_values is NULL — we only persist post-transition state (append-only log).
--
-- Skill rules: lock-short-transactions (no external I/O inside transaction),
--              security-privileges (security definer + set search_path = '').

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
  set status     = 'aceptado',
      updated_at = now()
  where id = v_order_id;

  insert into public.audit_log (table_name, operation, row_id, actor_id, new_values)
  values (
    'orders', 'UPDATE', v_order_id, v_user_id,
    jsonb_build_object(
      'orderId',     p_public_id::text,
      'actor',       'TIENDA',
      'eventType',   'TIENDA_ACEPTA',
      'fromStatus',  'recibido',
      'toStatus',    'aceptado',
      'occurredAt',  now()
    )
  );

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

  insert into public.audit_log (table_name, operation, row_id, actor_id, new_values)
  values (
    'orders', 'UPDATE', v_order_id, v_user_id,
    jsonb_build_object(
      'orderId',     p_public_id::text,
      'actor',       'TIENDA',
      'eventType',   'TIENDA_RECHAZA',
      'fromStatus',  'recibido',
      'toStatus',    'rechazado',
      'occurredAt',  now()
    )
  );

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

  insert into public.audit_log (table_name, operation, row_id, actor_id, new_values)
  values (
    'orders', 'UPDATE', v_order_id, v_user_id,
    jsonb_build_object(
      'orderId',     p_public_id::text,
      'actor',       'TIENDA',
      'eventType',   'TIENDA_FINALIZA',
      'fromStatus',  'en_camino',
      'toStatus',    'finalizado',
      'occurredAt',  now()
    )
  );

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute on function public.finalize_order_by_store(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- cancel_order_by_customer
-- ─────────────────────────────────────────────────────────────────────────────
-- The cancel RPC can transition from 'enviado' OR 'recibido', so we capture
-- the actual fromStatus using v_status (read before the UPDATE).

create or replace function public.cancel_order_by_customer(
  p_public_id uuid,
  p_reason    text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_uid             uuid;
  v_customer_internal_id bigint;
  v_order_id             bigint;
  v_status               public.order_status;
begin
  v_auth_uid := (select auth.uid());
  if v_auth_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id into v_customer_internal_id
  from public.users
  where auth_user_id = v_auth_uid;

  if v_customer_internal_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select id, status into v_order_id, v_status
  from public.orders
  where public_id = p_public_id and customer_id = v_customer_internal_id
  for update;

  if v_order_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_status not in ('enviado', 'recibido') then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status        = 'cancelado',
      cancelled_at  = now(),
      cancel_reason = p_reason,
      updated_at    = now()
  where id = v_order_id;

  insert into public.audit_log (table_name, operation, row_id, actor_id, new_values)
  values (
    'orders', 'UPDATE', v_order_id, v_customer_internal_id,
    jsonb_build_object(
      'orderId',     p_public_id::text,
      'actor',       'CLIENTE',
      'eventType',   'CLIENTE_CANCELA',
      'fromStatus',  v_status::text,
      'toStatus',    'cancelado',
      'occurredAt',  now()
    )
  );

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute
  on function public.cancel_order_by_customer(uuid, text)
  to authenticated;
