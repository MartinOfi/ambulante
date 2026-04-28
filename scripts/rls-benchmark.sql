-- rls-benchmark.sql — RLS performance benchmark for Ambulante
--
-- Generates production-scale synthetic data and asserts that the 5 most
-- critical domain queries complete within a 20 ms threshold using the
-- authenticated role (RLS fully enforced).
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/rls-benchmark.sql
--
-- Exit code: non-zero if any query exceeds the threshold (via RAISE EXCEPTION).
-- All synthetic data is cleaned up on success AND failure (pre-cleanup at step 0).

\set ON_ERROR_STOP on

\echo '>> RLS Benchmark — Ambulante (threshold: 20 ms per query)'

-- ─── 0. PRE-CLEANUP ────────────────────────────────────────────────────────────
-- Remove any stale bench data left by a previously aborted run.

\echo '>> [0/5] Pre-cleanup stale benchmark data...'

DELETE FROM public.orders
WHERE customer_id IN (SELECT id FROM public.users WHERE display_name LIKE '__bench_user_%')
   OR store_id IN (SELECT id FROM public.stores WHERE name LIKE '__bench_store_%');

DELETE FROM public.stores WHERE name LIKE '__bench_store_%';

DELETE FROM public.users WHERE display_name LIKE '__bench_user_%';

-- ─── 1. GENERATE SYNTHETIC DATA ────────────────────────────────────────────────

\echo '>> [1/5] Generating 1k users, 10k stores, 50k products, 100k orders...'

BEGIN;

-- 1 000 users: first 100 are tienda owners, remainder are clientes.
INSERT INTO public.users (auth_user_id, role, display_name)
SELECT
  gen_random_uuid(),
  CASE WHEN t.i <= 100
    THEN 'tienda'::public.user_role
    ELSE 'cliente'::public.user_role
  END,
  '__bench_user_' || t.i
FROM generate_series(1, 1000) AS t(i);

-- 10 000 stores: each tienda user owns 100 stores.
INSERT INTO public.stores (owner_id, name, available)
SELECT
  u.id,
  '__bench_store_' || t.i,
  (t.i % 5 = 0)        -- 20 % available
FROM generate_series(1, 10000) AS t(i)
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS rn
  FROM public.users
  WHERE display_name LIKE '__bench_user_%' AND role = 'tienda'
) u ON u.rn = ((t.i - 1) % 100);

-- 50 000 products (5 per store) — required for a meaningful Q4 benchmark.
INSERT INTO public.products (store_id, name, price, available)
SELECT
  s.id,
  '__bench_product_' || t.i,
  (50 + (t.i % 950))::numeric(10, 2),
  (t.i % 10 != 0)      -- 90 % available
FROM generate_series(1, 50000) AS t(i)
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS rn
  FROM public.stores
  WHERE name LIKE '__bench_store_%'
) s ON s.rn = ((t.i - 1) % 10000);

-- 100 000 orders spread across bench stores and bench customers.
-- Uses PL/pgSQL arrays to avoid a correlated subquery per row.
DO $$
DECLARE
  v_cids    bigint[];
  v_sids    bigint[];
  v_statuses public.order_status[] := ARRAY[
    'enviado', 'recibido', 'aceptado', 'en_camino',
    'finalizado', 'rechazado', 'cancelado', 'expirado'
  ]::public.order_status[];
  n_c       int;
  n_s       int;
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.users
    WHERE display_name LIKE '__bench_user_%' AND role = 'cliente'
    ORDER BY id
  ) INTO v_cids;

  SELECT ARRAY(
    SELECT id FROM public.stores
    WHERE name LIKE '__bench_store_%'
    ORDER BY id
  ) INTO v_sids;

  n_c := array_length(v_cids, 1);
  n_s := array_length(v_sids, 1);

  -- format() inlines n_s / n_c as integer literals (avoiding per-row array_length calls).
  -- $1, $2, $3 are passed via USING and resolve to the three bigint[]/order_status[] arrays.
  EXECUTE format($q$
    INSERT INTO public.orders (store_id, customer_id, status, created_at)
    SELECT
      ($1::bigint[])[(t.i %% %s) + 1],
      ($2::bigint[])[(t.i %% %s) + 1],
      ($3::public.order_status[])[(t.i %% 8) + 1],
      now() - ((t.i %% 43200) * interval '1 minute')
    FROM generate_series(0, 99999) AS t(i)
  $q$, n_s, n_c)
  USING v_sids, v_cids, v_statuses;
END $$;

-- 100 000 order_items (1 per bench order) — required for a meaningful Q5 benchmark.
INSERT INTO public.order_items (order_id, product_id, product_snapshot, quantity, unit_price)
SELECT
  o.id,
  NULL,
  '{"name":"Bench Product","price":500,"currency":"ARS"}'::jsonb,
  2,
  500.00
FROM public.orders o
JOIN public.users u ON u.id = o.customer_id
WHERE u.display_name LIKE '__bench_user_%';

COMMIT;

-- ─── 2. REFRESH STATISTICS ─────────────────────────────────────────────────────
-- ANALYZE must run outside a transaction so the planner sees the new row counts.

\echo '>> [2/5] Analyzing tables (refreshing planner statistics)...'

ANALYZE public.users;
ANALYZE public.stores;
ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.order_items;

-- ─── 3. BENCHMARK ASSERTIONS ───────────────────────────────────────────────────
-- Each query runs as role=authenticated with a real JWT claim, so RLS is fully
-- enforced. Timing is extracted from EXPLAIN (ANALYZE, FORMAT JSON).

\echo '>> [3/5] Running RLS performance assertions...'

DO $$
DECLARE
  v_plan             text;
  v_exec_time        float8;
  v_threshold        float8 := 20.0;      -- ms
  v_customer_uid     uuid;
  v_store_owner_uid  uuid;
  v_test_store_id    bigint;
  v_test_order_id    bigint;
  v_any_fail         boolean := false;
  v_q_name           text;
BEGIN

  -- ── Pick test actors ──────────────────────────────────────────────────────
  SELECT auth_user_id INTO STRICT v_customer_uid
  FROM public.users
  WHERE display_name LIKE '__bench_user_%' AND role = 'cliente'
  LIMIT 1;

  SELECT u.auth_user_id, s.id
  INTO STRICT v_store_owner_uid, v_test_store_id
  FROM public.users u
  JOIN public.stores s ON s.owner_id = u.id
  WHERE u.display_name LIKE '__bench_user_%' AND u.role = 'tienda'
  LIMIT 1;

  -- ── Prereq: get a real order id owned by the bench customer ───────────────
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_customer_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  SELECT id INTO v_test_order_id
  FROM public.orders
  WHERE customer_id = (SELECT public.current_user_id())
  LIMIT 1;

  EXECUTE 'RESET ROLE';

  IF v_test_order_id IS NULL THEN
    RAISE EXCEPTION 'No bench orders found for bench customer — Step 1 data generation may have failed.';
  END IF;

  -- Wrap all query blocks so RESET ROLE always runs on error.
  BEGIN

  -- ── Q1: Available stores for the map (customer auth) ──────────────────────
  v_q_name := 'Q1  available stores (map query, customer view)';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_customer_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || $q$
    SELECT id, name, available, current_location
    FROM public.stores
    WHERE available = true
    ORDER BY id LIMIT 50
  $q$ INTO v_plan;
  v_exec_time := (v_plan::json -> 0 ->> 'Execution Time')::float8;
  RAISE NOTICE '%: % ms%', v_q_name, round(v_exec_time::numeric, 2),
    CASE WHEN v_exec_time <= v_threshold THEN ' ✓' ELSE ' ✗  EXCEEDS THRESHOLD' END;
  IF v_exec_time > v_threshold THEN v_any_fail := true; END IF;

  EXECUTE 'RESET ROLE';

  -- ── Q2: Customer order history ────────────────────────────────────────────
  v_q_name := 'Q2  customer order history (orders_customer_created_idx)';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_customer_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || $q$
    SELECT id, status, store_id, created_at
    FROM public.orders
    WHERE customer_id = (SELECT public.current_user_id())
    ORDER BY created_at DESC LIMIT 20
  $q$ INTO v_plan;
  v_exec_time := (v_plan::json -> 0 ->> 'Execution Time')::float8;
  RAISE NOTICE '%: % ms%', v_q_name, round(v_exec_time::numeric, 2),
    CASE WHEN v_exec_time <= v_threshold THEN ' ✓' ELSE ' ✗  EXCEEDS THRESHOLD' END;
  IF v_exec_time > v_threshold THEN v_any_fail := true; END IF;

  EXECUTE 'RESET ROLE';

  -- ── Q3: Store inbox — active orders (tienda auth) ─────────────────────────
  v_q_name := 'Q3  store active inbox (orders_store_status_created_idx)';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_store_owner_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || $q$
    SELECT id, status, customer_id, created_at
    FROM public.orders
    WHERE store_id = (SELECT public.current_store_id())
      AND status IN ('enviado', 'recibido', 'aceptado')
    ORDER BY created_at DESC
  $q$ INTO v_plan;
  v_exec_time := (v_plan::json -> 0 ->> 'Execution Time')::float8;
  RAISE NOTICE '%: % ms%', v_q_name, round(v_exec_time::numeric, 2),
    CASE WHEN v_exec_time <= v_threshold THEN ' ✓' ELSE ' ✗  EXCEEDS THRESHOLD' END;
  IF v_exec_time > v_threshold THEN v_any_fail := true; END IF;

  EXECUTE 'RESET ROLE';

  -- ── Q4: Store catalog — products (tienda auth) ────────────────────────────
  v_q_name := 'Q4  store catalog / products (products_store_available_idx)';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_store_owner_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || $q$
    SELECT id, name, price, available
    FROM public.products
    WHERE store_id = (SELECT public.current_store_id())
    ORDER BY name
  $q$ INTO v_plan;
  v_exec_time := (v_plan::json -> 0 ->> 'Execution Time')::float8;
  RAISE NOTICE '%: % ms%', v_q_name, round(v_exec_time::numeric, 2),
    CASE WHEN v_exec_time <= v_threshold THEN ' ✓' ELSE ' ✗  EXCEEDS THRESHOLD' END;
  IF v_exec_time > v_threshold THEN v_any_fail := true; END IF;

  EXECUTE 'RESET ROLE';

  -- ── Q5: Order items for one order (customer auth, EXISTS RLS check) ────────
  v_q_name := 'Q5  order items for one order (order_items_order_id_idx + EXISTS RLS)';
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_customer_uid::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || format($q$
    SELECT id, product_snapshot, quantity, unit_price
    FROM public.order_items
    WHERE order_id = %s
  $q$, v_test_order_id) INTO v_plan;
  v_exec_time := (v_plan::json -> 0 ->> 'Execution Time')::float8;
  RAISE NOTICE '%: % ms%', v_q_name, round(v_exec_time::numeric, 2),
    CASE WHEN v_exec_time <= v_threshold THEN ' ✓' ELSE ' ✗  EXCEEDS THRESHOLD' END;
  IF v_exec_time > v_threshold THEN v_any_fail := true; END IF;

  EXECUTE 'RESET ROLE';

  EXCEPTION WHEN OTHERS THEN
    -- Guarantee role is reset even if an EXPLAIN or set_config call fails.
    EXECUTE 'RESET ROLE';
    RAISE;
  END;

  -- ── Final result ──────────────────────────────────────────────────────────
  IF v_any_fail THEN
    RAISE EXCEPTION
      E'RLS benchmark FAILED — one or more queries exceeded the % ms threshold.\n'
      'See NOTICE lines above for per-query breakdown.\n'
      'Possible causes: missing index, bare auth.uid() in policy, or plan regression.',
      v_threshold;
  END IF;

  RAISE NOTICE '>> All 5 queries passed the % ms RLS performance threshold.', v_threshold::int;
END $$;

-- ─── 4. CLEANUP ────────────────────────────────────────────────────────────────

\echo '>> [4/5] Cleaning up synthetic data...'

BEGIN;

-- order_items cascade via orders FK (ON DELETE CASCADE)
DELETE FROM public.orders
WHERE customer_id IN (SELECT id FROM public.users WHERE display_name LIKE '__bench_user_%')
   OR store_id IN (SELECT id FROM public.stores WHERE name LIKE '__bench_store_%');

-- products cascade via stores FK (ON DELETE CASCADE)
DELETE FROM public.stores WHERE name LIKE '__bench_store_%';

DELETE FROM public.users WHERE display_name LIKE '__bench_user_%';

COMMIT;

\echo '>> [5/5] Benchmark complete.'
