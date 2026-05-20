-- Migration: confirm_on_the_way_by_customer RPC
-- Transition: ACEPTADO → EN_CAMINO (triggered by the customer)
-- PRD §7.1: customer confirms they are on their way to pick up the order.
-- Pattern mirrors cancel_order_by_customer: SECURITY DEFINER + auth.uid() check.

create or replace function public.confirm_on_the_way_by_customer(
  p_public_id uuid
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

  if v_status <> 'aceptado' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_transition',
      'currentStatus', v_status::text
    );
  end if;

  update public.orders
  set status     = 'en_camino',
      updated_at = now()
  where id = v_order_id;

  insert into public.audit_log (table_name, operation, row_id, actor_id, new_values)
  values (
    'orders', 'UPDATE', v_order_id, v_customer_internal_id,
    jsonb_build_object(
      'orderId',    p_public_id::text,
      'actor',      'CLIENTE',
      'eventType',  'CLIENTE_CONFIRMA_EN_CAMINO',
      'fromStatus', 'aceptado',
      'toStatus',   'en_camino',
      'occurredAt', now()
    )
  );

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute
  on function public.confirm_on_the_way_by_customer(uuid)
  to authenticated;
