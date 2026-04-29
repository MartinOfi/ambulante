-- B9-B.2 — Cancel order from customer side.
--
-- 1. Add timestamp + reason columns on orders for cancellation audit trail.
-- 2. RPC cancel_order_by_customer: short transaction (skill rule
--    lock-short-transactions) that locks the order row, validates state
--    machine transition (only ENVIADO/RECIBIDO can be cancelled by the
--    customer per PRD §7.1), updates status, and returns a discriminated
--    JSON result mapped by the action layer.
--
-- Skill rules: lock-short-transactions, security-privileges,
--              security-rls-performance.

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema: cancellation columns on orders
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists cancelled_at  timestamptz,
  add column if not exists cancel_reason text;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: cancel_order_by_customer
-- ─────────────────────────────────────────────────────────────────────────────
-- Returns a discriminated JSON object:
--   { ok: true,  publicId: <uuid> }
--   { ok: false, error: 'unauthenticated' | 'not_found' }
--   { ok: false, error: 'invalid_transition', currentStatus: <text> }
--
-- security definer + set search_path = '' — skill rule security-privileges.
-- (select auth.uid()) is evaluated once — skill rule security-rls-performance.

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

  -- Lock the row to serialize concurrent cancel attempts (skill rule
  -- lock-short-transactions). RLS is bypassed by security definer, so we
  -- enforce ownership explicitly via customer_id match.
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

  return jsonb_build_object('ok', true, 'publicId', p_public_id::text);
end;
$$;

grant execute
  on function public.cancel_order_by_customer(uuid, text)
  to authenticated;
