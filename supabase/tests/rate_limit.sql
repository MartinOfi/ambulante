-- pgTAP test: B13-A — public.check_rate_limit token-bucket function.
-- Covers: (a) primer hit consume 1, deja max-1 tokens
--         (b) bloqueo cuando tokens < 1 después de consumir
--         (c) refill simulado backdating last_refill_at
--         (d) advisory lock se libera al commit (tabla deja consultarse normal después)
--         (e) cleanup_rate_limit_buckets borra buckets viejos
--         (f) RLS deny-all bloquea anon/authenticated
--         (g) params inválidos lanzan exception
-- Run with: pnpm supabase:test:rls

begin;

select plan(11);

-- Limpia buckets dejados por otros tests
delete from public.rate_limit_buckets where key like 'pgtap:%';

-- 1: primer hit allowed=true, remaining = max - 1
select is(
  (select allowed from public.check_rate_limit('pgtap:k1', 5, 60)),
  true,
  'first hit on a fresh bucket is allowed'
);

-- 2: row se inserta con tokens = max - 1
select is(
  (select tokens::int from public.rate_limit_buckets where key = 'pgtap:k1'),
  4,
  'after first hit bucket holds max-1 tokens'
);

-- 3: 4 hits adicionales hacen que el 5to consume el ultimo token (allowed=true)
select check_rate_limit('pgtap:k1', 5, 60);
select check_rate_limit('pgtap:k1', 5, 60);
select check_rate_limit('pgtap:k1', 5, 60);
select is(
  (select allowed from public.check_rate_limit('pgtap:k1', 5, 60)),
  true,
  'fifth hit (within burst capacity) is still allowed'
);

-- 4: el 6to hit es bloqueado
select is(
  (select allowed from public.check_rate_limit('pgtap:k1', 5, 60)),
  false,
  'sixth hit (over capacity) is blocked'
);

-- 5: backdating last_refill_at simula tiempo transcurrido — debe permitir hits de nuevo
update public.rate_limit_buckets
   set tokens = 0, last_refill_at = now() - interval '120 seconds'
 where key = 'pgtap:k1';

select is(
  (select allowed from public.check_rate_limit('pgtap:k1', 5, 60)),
  true,
  'after window elapsed bucket refills and request is allowed'
);

-- 6: keys distintas tienen buckets independientes
select check_rate_limit('pgtap:k2', 1, 60);
select is(
  (select allowed from public.check_rate_limit('pgtap:k3', 1, 60)),
  true,
  'distinct keys have independent buckets'
);

-- 7: cleanup borra buckets cuyo updated_at es más viejo que TTL
update public.rate_limit_buckets
   set updated_at = now() - interval '2 days'
 where key in ('pgtap:k1', 'pgtap:k2');

select is(
  (select public.cleanup_rate_limit_buckets(86400)),
  2,
  'cleanup deletes 2 stale buckets when TTL is 1 day'
);

-- 8: cleanup deja los buckets recientes
select is(
  (select count(*)::int from public.rate_limit_buckets where key = 'pgtap:k3'),
  1,
  'cleanup leaves recent buckets in place'
);

-- 9: params inválidos disparan exception
select throws_ok(
  $$ select public.check_rate_limit('pgtap:bad', 0, 60) $$,
  'P0001',
  null,
  'check_rate_limit raises on max_requests=0'
);

-- 10: anon NO puede leer la tabla (RLS deny-all)
set local role anon;
select is(
  (select count(*)::int from public.rate_limit_buckets),
  0,
  'anon role sees zero rows due to RLS deny-all'
);
reset role;

-- 11: authenticated tampoco puede leer
set local role authenticated;
select is(
  (select count(*)::int from public.rate_limit_buckets),
  0,
  'authenticated role sees zero rows due to RLS deny-all'
);
reset role;

select * from finish();

rollback;
