-- B13-A: rate limiting in-DB with token bucket.
--
-- Replaces the per-isolate InMemoryRateLimiter with a shared-state limiter
-- that survives across Vercel serverless invocations. Token-bucket algorithm:
-- each bucket starts full (max_requests tokens), consumes 1 per request, and
-- refills at (max_requests / window_seconds) tokens/second. A request is
-- allowed iff the bucket has >=1 token after refill.
--
-- Concurrency: pg_advisory_xact_lock(hashtext(key)) serializes updates to
-- the same key without locking the entire table (skill rule lock-advisory).
-- Locks are released on commit/rollback and the function never holds them
-- across I/O — the entire body runs in microseconds (skill rule
-- lock-short-transactions).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
-- Natural text PK: rate-limit buckets are looked up exclusively by their
-- composite identifier (e.g. ip address, or rule:identifier in the future);
-- a surrogate bigint adds an index without value. Override of the
-- bigint-default convention is intentional and scoped to this table.
create table if not exists public.rate_limit_buckets (
  key             text             primary key,
  tokens          double precision not null,
  last_refill_at  timestamptz      not null default now(),
  updated_at      timestamptz      not null default now()
);

create index if not exists idx_rate_limit_buckets_updated_at
  on public.rate_limit_buckets (updated_at);

-- ---------------------------------------------------------------------------
-- 2. RLS — deny all for anon/authenticated. Only service_role bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.rate_limit_buckets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policy
    where polname  = 'rate_limit_buckets_deny_all'
      and polrelid = 'public.rate_limit_buckets'::regclass
  ) then
    create policy rate_limit_buckets_deny_all
      on public.rate_limit_buckets
      for all
      using (false);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. check_rate_limit: token-bucket gate.
-- Returns (allowed, remaining tokens, reset_at_ms epoch).
-- ---------------------------------------------------------------------------
create or replace function public.check_rate_limit(
  p_key             text,
  p_max_requests    integer,
  p_window_seconds  integer
)
returns table (
  allowed     boolean,
  remaining   double precision,
  reset_at_ms double precision
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now                     timestamptz      := clock_timestamp();
  v_refill_per_sec          double precision := p_max_requests::double precision
                                                / nullif(p_window_seconds, 0)::double precision;
  v_bucket                  public.rate_limit_buckets%rowtype;
  v_elapsed_seconds         double precision;
  v_refilled_tokens         double precision;
  v_resulting_tokens        double precision;
  v_allowed                 boolean;
  v_seconds_until_next      double precision;
begin
  if p_max_requests <= 0 or p_window_seconds <= 0 then
    raise exception 'check_rate_limit: invalid params (max_requests=%, window_seconds=%)',
      p_max_requests, p_window_seconds;
  end if;

  -- Per-key serialization, released on commit/rollback. hashtext collisions
  -- only cost a tiny bit of contention; correctness is preserved.
  perform pg_advisory_xact_lock(hashtext(p_key));

  select * into v_bucket
    from public.rate_limit_buckets
   where key = p_key;

  if not found then
    -- First request: start with max tokens, consume one. Next token is
    -- available immediately if max >= 2; otherwise refill takes 1/rate seconds.
    insert into public.rate_limit_buckets (key, tokens, last_refill_at, updated_at)
    values (p_key, p_max_requests::double precision - 1, v_now, v_now);

    v_seconds_until_next := case
      when p_max_requests >= 2 then 0
      when v_refill_per_sec > 0 then 1.0 / v_refill_per_sec
      else p_window_seconds::double precision
    end;

    return query select
      true,
      (p_max_requests::double precision - 1),
      (extract(epoch from v_now) * 1000 + v_seconds_until_next * 1000);
    return;
  end if;

  v_elapsed_seconds := extract(epoch from (v_now - v_bucket.last_refill_at));
  v_refilled_tokens := least(
    p_max_requests::double precision,
    v_bucket.tokens + v_elapsed_seconds * v_refill_per_sec
  );

  if v_refilled_tokens >= 1 then
    v_resulting_tokens := v_refilled_tokens - 1;
    v_allowed          := true;
  else
    v_resulting_tokens := v_refilled_tokens;
    v_allowed          := false;
  end if;

  update public.rate_limit_buckets
     set tokens         = v_resulting_tokens,
         last_refill_at = v_now,
         updated_at     = v_now
   where key = p_key;

  -- reset_at_ms: wall-clock ms when the bucket holds >=1 token (i.e. when a
  -- subsequent request would succeed). Maps directly to RFC 6585 Retry-After
  -- semantics. NOT "time until full" — that would 5x-overstate Retry-After
  -- for low-capacity rules and trigger over-aggressive client backoff.
  v_seconds_until_next := case
    when v_resulting_tokens >= 1 then 0
    when v_refill_per_sec > 0 then (1.0 - v_resulting_tokens) / v_refill_per_sec
    else p_window_seconds::double precision
  end;

  return query select
    v_allowed,
    v_resulting_tokens,
    (extract(epoch from v_now) * 1000 + v_seconds_until_next * 1000);
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public;
grant  execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 4. cleanup_rate_limit_buckets: garbage-collect inactive buckets.
-- Run from a scheduled cron; idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_rate_limit_buckets(
  p_ttl_seconds integer default 86400
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  -- Guard against accidental purge-all if cron passes 0 or negative.
  if p_ttl_seconds <= 0 then
    raise exception 'cleanup_rate_limit_buckets: p_ttl_seconds must be > 0, got %',
      p_ttl_seconds;
  end if;

  with deleted as (
    delete from public.rate_limit_buckets
     where updated_at < now() - make_interval(secs => p_ttl_seconds)
    returning 1
  )
  select coalesce(count(*)::integer, 0) into v_deleted from deleted;

  return v_deleted;
end;
$$;

revoke execute on function public.cleanup_rate_limit_buckets(integer) from public;
grant  execute on function public.cleanup_rate_limit_buckets(integer) to service_role;
