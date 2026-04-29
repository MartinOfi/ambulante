-- Migration: get_top_slow_queries helper
-- Returns the top N slowest queries from pg_stat_statements.
-- SECURITY DEFINER so the function runs as the postgres superuser,
-- giving it read access to pg_stat_statements regardless of the caller's
-- Postgres role. The explicit is_admin() guard prevents non-admins from
-- using it directly (e.g. via Supabase Studio RPC).

create or replace function public.get_top_slow_queries(p_limit int default 20)
returns table(
  calls         bigint,
  total_exec_time_ms numeric,
  mean_exec_time_ms  numeric,
  query_text    text
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;

  return query
    select
      pss.calls,
      round(pss.total_exec_time::numeric, 2),
      round(pss.mean_exec_time::numeric, 2),
      pss.query
    from pg_stat_statements pss
    order by pss.mean_exec_time desc
    limit p_limit;
end;
$$;

grant execute on function public.get_top_slow_queries(int) to authenticated;
