-- B12-A: observability — slow query alerts infrastructure.
-- Adds:
--   1. slow_query_baselines table — weekly snapshot of pg_stat_statements per queryid
--      so we can detect regressions (>50% above the 7-day-old mean) on top of the
--      absolute 100ms threshold from B12.1.
--   2. internal.snapshot_slow_query_baseline() — captures the current mean per queryid.
--      Called weekly by cron.
--   3. public.get_slow_queries_for_alerts(p_threshold_ms, p_limit, p_baseline_factor,
--      p_baseline_min_age_days) — returns rows that breach either the absolute
--      threshold or the relative baseline ratio. Called every 5 minutes by
--      /api/cron/check-slow-queries via PostgREST .rpc(). Lives in `public` because
--      PostgREST only exposes functions in the schemas listed in supabase/config.toml
--      (public, graphql_public); execute is restricted to service_role + postgres.
--   4. cron schedules: check-slow-queries (*/5 * * * *) and snapshot-slow-query-baseline
--      (weekly on Sunday at 03:00 UTC).
--
-- Depends on: B1.1 (pg_stat_statements + pg_cron + pg_net), B7.1 (internal schema +
-- internal.call_cron_endpoint helper).

-- ---------------------------------------------------------------------------
-- 1. Baseline table
-- ---------------------------------------------------------------------------
-- queryid is pg_stat_statements' own bigint identifier — NOT a foreign key
-- (the extension's view is not a real table). PK by (queryid, captured_at) lets
-- us keep a small history without unbounded growth. Index on captured_at for
-- the "find most recent baseline at least N days old" query.
create table if not exists public.slow_query_baselines (
  queryid             bigint     not null,
  captured_at         timestamptz not null default now(),
  mean_exec_time_ms   numeric    not null,
  calls               bigint     not null,
  primary key (queryid, captured_at)
);

create index if not exists idx_slow_query_baselines_captured_at
  on public.slow_query_baselines (captured_at desc);

-- The baseline table holds operational telemetry, not user data. RLS on with
-- no policies = no role can read or write it via PostgREST. Service role
-- bypasses RLS for the cron route handler, and SECURITY DEFINER functions
-- below give us controlled access from pg_cron jobs.
alter table public.slow_query_baselines enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Snapshot function — captures the current mean per queryid
-- ---------------------------------------------------------------------------
create or replace function internal.snapshot_slow_query_baseline()
  returns integer
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_inserted integer;
begin
  -- pg_stat_statements has one row per (queryid, dbid, userid) — aggregate by
  -- queryid so we store one baseline mean per logical query.
  insert into public.slow_query_baselines (queryid, mean_exec_time_ms, calls)
  select
    pss.queryid,
    round((sum(pss.total_exec_time) / nullif(sum(pss.calls), 0))::numeric, 2),
    sum(pss.calls)::bigint
  from extensions.pg_stat_statements pss
  where pss.calls > 0
    and pss.queryid is not null
  group by pss.queryid;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function internal.snapshot_slow_query_baseline() from public;
grant  execute on function internal.snapshot_slow_query_baseline() to postgres;

-- ---------------------------------------------------------------------------
-- 3. Reader function for the alert cron
-- ---------------------------------------------------------------------------
-- Returns one row per breaching query. A query is "breaching" when:
--   - mean_exec_time_ms > p_threshold_ms (absolute), or
--   - mean_exec_time_ms > baseline_mean_ms * p_baseline_factor (relative regression)
-- baseline_mean_ms is the most recent baseline entry at least p_baseline_min_age_days
-- days old; if absent (e.g. before the first weekly snapshot ran), the relative
-- check is skipped and only the absolute threshold applies.
--
-- Lives in `public` schema so PostgREST exposes it via /rest/v1/rpc/<name> for
-- the service-role-authenticated cron route handler. Restricted via explicit
-- grants — anon and authenticated cannot execute it. The matching B12.1
-- function `get_top_slow_queries` follows the same pattern.
create or replace function public.get_slow_queries_for_alerts(
  p_threshold_ms              numeric default 100,
  p_limit                     int     default 50,
  p_baseline_factor           numeric default 1.5,
  p_baseline_min_age_days     int     default 6
)
  returns table(
    queryid            bigint,
    mean_exec_time_ms  numeric,
    calls              bigint,
    total_exec_time_ms numeric,
    query_text         text,
    baseline_mean_ms   numeric,
    breach_kind        text
  )
  language plpgsql
  security definer
  stable
  set search_path = ''
as $$
begin
  return query
    with current_stats as (
      select
        pss.queryid,
        round((sum(pss.total_exec_time) / nullif(sum(pss.calls), 0))::numeric, 2)
                                                    as mean_exec_time_ms,
        sum(pss.calls)::bigint                       as calls,
        round(sum(pss.total_exec_time)::numeric, 2)  as total_exec_time_ms,
        max(pss.query)                               as query_text
      from extensions.pg_stat_statements pss
      where pss.calls > 0
        and pss.queryid is not null
      group by pss.queryid
    ),
    baseline as (
      select distinct on (b.queryid)
        b.queryid,
        b.mean_exec_time_ms as baseline_mean_ms
      from public.slow_query_baselines b
      where b.captured_at <= now() - make_interval(days => p_baseline_min_age_days)
      order by b.queryid, b.captured_at desc
    )
    select
      cs.queryid,
      cs.mean_exec_time_ms,
      cs.calls,
      cs.total_exec_time_ms,
      cs.query_text,
      bl.baseline_mean_ms,
      -- WHERE clause below guarantees at least one branch matches; no `else`
      -- needed. Order matters: combined breach must be checked before its
      -- individual sub-conditions.
      case
        when bl.baseline_mean_ms is not null
             and cs.mean_exec_time_ms > bl.baseline_mean_ms * p_baseline_factor
             and cs.mean_exec_time_ms > p_threshold_ms then 'absolute_and_regression'
        when bl.baseline_mean_ms is not null
             and cs.mean_exec_time_ms > bl.baseline_mean_ms * p_baseline_factor then 'regression'
        when cs.mean_exec_time_ms > p_threshold_ms then 'absolute'
      end as breach_kind
    from current_stats cs
    left join baseline bl on bl.queryid = cs.queryid
    where cs.mean_exec_time_ms > p_threshold_ms
       or (bl.baseline_mean_ms is not null
           and cs.mean_exec_time_ms > bl.baseline_mean_ms * p_baseline_factor)
    order by cs.mean_exec_time_ms desc
    limit p_limit;
end;
$$;

revoke all      on function public.get_slow_queries_for_alerts(numeric, int, numeric, int) from public;
revoke all      on function public.get_slow_queries_for_alerts(numeric, int, numeric, int) from anon, authenticated;
grant  execute  on function public.get_slow_queries_for_alerts(numeric, int, numeric, int) to service_role;
grant  execute  on function public.get_slow_queries_for_alerts(numeric, int, numeric, int) to postgres;

-- ---------------------------------------------------------------------------
-- 4. Cron schedules — idempotent (unschedule first to survive re-runs).
-- ---------------------------------------------------------------------------
select cron.unschedule('check-slow-queries')
  where exists (select 1 from cron.job where jobname = 'check-slow-queries');

select cron.unschedule('snapshot-slow-query-baseline')
  where exists (select 1 from cron.job where jobname = 'snapshot-slow-query-baseline');

select cron.schedule(
  'check-slow-queries',
  '*/5 * * * *',
  $job$ select internal.call_cron_endpoint('/api/cron/check-slow-queries') $job$
);

select cron.schedule(
  'snapshot-slow-query-baseline',
  '0 3 * * 0',
  $job$ select internal.snapshot_slow_query_baseline() $job$
);
