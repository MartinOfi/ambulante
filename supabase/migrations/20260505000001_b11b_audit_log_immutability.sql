-- B11-B — Audit log append-only enforcement.
--
-- RLS policies already restrict SELECT to admins and block INSERT from clients,
-- but service_role bypasses RLS entirely. A BEFORE UPDATE OR DELETE trigger
-- fires unconditionally — no role can bypass it — so it's the only layer
-- that reliably prevents accidental mutations from our own backend code.
--
-- Skill rules: security-privileges (trigger + security definer), lock-short-transactions
-- (trigger body is a single RAISE, no I/O).

-- ── Trigger function ──────────────────────────────────────────────────────────
-- No search_path needed: only references TG_OP and OLD.id (system vars).
create or replace function public.audit_log_deny_mutations()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'audit_log is append-only: % on row id=% is forbidden',
    TG_OP, old.id
    using errcode = 'restrict_violation';
end;
$$;

-- ── Trigger ───────────────────────────────────────────────────────────────────
drop trigger if exists trg_audit_log_immutability on public.audit_log;

create trigger trg_audit_log_immutability
  before update or delete on public.audit_log
  for each row
  execute function public.audit_log_deny_mutations();
