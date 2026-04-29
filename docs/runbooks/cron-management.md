# Cron management runbook

> **Cuándo usarlo:** un cron job se rompió, está spammeando errores, o hay que apagarlo en caliente sin esperar un deploy. Cubre los dos jobs activos: `expire-orders` (cada 1 min) y `auto-close-orders` (cada 10 min).
> **Pre-requisitos:** acceso a la DB de Supabase como `postgres` (Studio → SQL Editor en prod, `docker exec` o `pnpm supabase` en local).
> **Contexto técnico:** los jobs viven en `cron.job` y disparan `internal.call_cron_endpoint(path)`, que hace un `net.http_post()` autenticado con `CRON_SECRET` contra el Route Handler de Next.js. La concurrency (`for update skip locked`) vive dentro de los RPCs `claim_expirable_orders` / `claim_auto_closeable_orders`. Migración de origen: `supabase/migrations/20260428000001_schedule_crons.sql`.

---

## 1. Apagar un cron en incidente

**Cuándo:** el handler está fallando en loop, está saturando un servicio externo (push provider), o se descubrió un bug que afecta datos en producción.

`cron.unschedule()` borra el job entero (no es un toggle). Es seguro: la próxima migración lo recrea con el mismo nombre.

```sql
-- Apagar expire-orders
select cron.unschedule('expire-orders');

-- Apagar auto-close-orders
select cron.unschedule('auto-close-orders');
```

**Verificación:**

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname in ('expire-orders', 'auto-close-orders');
-- Debe devolver 0 filas si lo apagaste.
```

> **Alternativa menos destructiva:** `update cron.job set active = false where jobname = 'expire-orders';`. Mantiene el row pero deja de ejecutarse. Útil si querés re-activarlo pronto sin re-correr la migración.

---

## 2. Reactivar un cron

**Si lo deshabilitaste con `update active = false`:**

```sql
update cron.job set active = true where jobname = 'expire-orders';
```

**Si lo borraste con `cron.unschedule`:** rerun de la migración:

```sql
select cron.schedule(
  'expire-orders',
  '* * * * *',
  $job$ select internal.call_cron_endpoint('/api/cron/expire-orders') $job$
);

select cron.schedule(
  'auto-close-orders',
  '*/10 * * * *',
  $job$ select internal.call_cron_endpoint('/api/cron/auto-close-orders') $job$
);
```

> Los `cron.schedule` calls son idempotentes: si ya existe un job con ese nombre, lo reemplazan.

---

## 3. Inspeccionar ejecuciones recientes

`cron.job_run_details` tiene historial completo. Las ejecuciones más útiles son las últimas 10–50 minutos.

**Últimas 20 ejecuciones de un job:**

```sql
select runid, status, start_time, end_time,
       end_time - start_time as duration,
       return_message
from cron.job_run_details
where jobname = 'expire-orders'  -- o 'auto-close-orders'
order by start_time desc
limit 20;
```

**Estadísticas de la última hora (succeeded vs failed):**

```sql
select
  jobname,
  status,
  count(*) as runs,
  avg(end_time - start_time) as avg_duration
from cron.job_run_details
where start_time > now() - interval '1 hour'
group by jobname, status
order by jobname, status;
```

> El campo `command` muestra el SQL exacto que pg_cron ejecutó. Útil para confirmar que la migración correcta está activa.

---

## 4. Inspeccionar errores

### 4.1 — `cron.job_run_details` con `status = 'failed'`

```sql
select runid, start_time, return_message
from cron.job_run_details
where jobname = 'expire-orders'
  and status = 'failed'
order by start_time desc
limit 10;
```

`return_message` contiene el error de Postgres (ej. "function ... does not exist", "permission denied"). Si `internal.call_cron_endpoint` cambió de firma o se renombró, esto lo detecta.

### 4.2 — Respuestas HTTP de pg_net

`call_cron_endpoint` es fire-and-forget: el cron termina en `succeeded` apenas pg_net acepta la request. El status real del Route Handler (200 / 401 / 500) vive en `net._http_response`.

```sql
select
  r.id,
  r.created,
  r.status_code,
  r.timed_out,
  r.error_msg,
  -- las primeras 200 chars del body son suficientes para distinguir 401/500/etc.
  left(r.content, 200) as content_preview
from net._http_response r
where r.created > now() - interval '15 minutes'
order by r.created desc
limit 30;
```

**Síntomas comunes:**
- `status_code = 401` → `CRON_SECRET` desincronizado entre `app.settings.cron_secret` y la env del Next.js. Confirmar con `select current_setting('app.settings.cron_secret', true)`.
- `status_code = 503` → handler levantó pero `env.CRON_SECRET` o las creds de Supabase no están seteadas en Next.js (ver el guard de env vars al inicio del `POST` en `app/api/cron/<job>/route.ts`).
- `timed_out = true` → el handler tardó más que el timeout de `pg_net` (configurable; consultar la versión instalada con `select extversion from pg_extension where extname='pg_net'` y la doc de esa versión). Probablemente la RPC `claim_*` está lockeada por una transacción colgada — ver §6.
- `status_code = 500` → fallo en el handler o en la RPC. `content_preview` muestra el JSON con `{"error":"..."}` y los logs de Next.js (Sentry / Vercel) tienen el stacktrace.

---

## 5. Reprocesar una ventana perdida

**Cuándo:** el cron estuvo apagado N minutos y quedaron orders en `enviado`/`recibido` con `created_at` viejo (>10 min) que nunca se expiraron, o orders en `aceptado` con `updated_at` viejo (>2 h) que nunca se cerraron.

### 5.1 — Disparo manual desde la DB (mismo path que el cron)

```sql
-- Equivalente a una ejecución del cron expire-orders
select internal.call_cron_endpoint('/api/cron/expire-orders');

-- Equivalente a una ejecución del cron auto-close-orders
select internal.call_cron_endpoint('/api/cron/auto-close-orders');
```

Verificá la respuesta en `net._http_response` (§4.2). Repetí mientras el handler devuelva `count > 0` (cada ejecución procesa el lote actual; si hay >1 lote-por-vuelta de orders pendientes, hace falta correrlo varias veces).

### 5.2 — Disparo manual desde shell (útil si la DB está unhealthy)

```sh
# Local
curl -X POST http://localhost:3000/api/cron/expire-orders \
  -H "Authorization: Bearer $CRON_SECRET"

# Prod (sustituir HOST + CRON_SECRET por los valores reales)
curl -X POST "https://$HOST/api/cron/expire-orders" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Respuesta: `{"count": <n>, "auditFailures": <n>}`. Repetir hasta que `count = 0`.

### 5.3 — Auditoría del backlog antes de reprocesar

Para saber cuántas órdenes están afectadas antes de tirar el reproceso:

```sql
-- Backlog de expirables pendientes
select count(*) from public.orders
where status in ('enviado', 'recibido')
  and created_at < now() - interval '10 minutes';

-- Backlog de auto-closeables pendientes
select count(*) from public.orders
where status = 'aceptado'
  and updated_at < now() - interval '2 hours';
```

---

## 6. Diagnóstico de transacciones lockeadas

Si los handlers empiezan a timeoutear (§4.2 con `timed_out = true`) o las ejecuciones de `cron.job_run_details` aparecen con `duration > 1s`, probablemente hay una transacción larga lockeando filas de `orders` y los workers concurrentes están saltando con `skip locked` pero nunca progresan.

```sql
-- Transacciones activas tocando public.orders ordenadas por antigüedad
select pid, usename, application_name, state, wait_event_type, wait_event,
       query_start, now() - query_start as elapsed,
       left(query, 300) as query_preview
from pg_stat_activity
where datname = current_database()
  and state <> 'idle'
  and query ilike '%public.orders%'
order by query_start asc;
```

Si encontrás un PID viejo (>30s) que NO es el handler del cron, podés cancelarlo:

```sql
-- Cancelar la query (suave): pide al backend que aborte
select pg_cancel_backend(<pid>);

-- Si no responde en 10s, terminar el backend (duro)
select pg_terminate_backend(<pid>);
```

> **Atención:** terminar un backend en prod aborta su transacción; los locks se liberan, pero cualquier write sin `commit` se pierde. Usar sólo cuando esté confirmado que la query es la culpable.

---

## 7. Checklist de incidente

Cuando llega un alert de "los crons no están corriendo / fallando":

1. **¿Están registrados?** → §3, query a `cron.job`. Si falta alguno, §2 para reactivar.
2. **¿Están corriendo?** → §3 query a `cron.job_run_details` últimas 10 min. Sin filas → revisar `cron.job` y el extension status (`select * from pg_extension where extname='pg_cron'`).
3. **¿Están terminando OK?** → §4.1 status de los runs. Si todos `succeeded` pero el síntoma persiste → §4.2 (la falla está en HTTP, no en la DB).
4. **¿El handler responde 200?** → §4.2 net._http_response. Distinguir 401 (secret) / 503 (env vars) / 500 (logic) / timeout (locks).
5. **Si todo eso está OK y aún hay backlog:** §6 (transacciones lockeadas) o el ratio "orders ingresan más rápido que el batch sale" — escalar el batch (parámetro `p_expiration_minutes` no aplica acá; sería un cambio de migración).
6. **Mitigación temporal** mientras se diagnostica: §1 para apagar el cron y §5 (reproceso manual) para drenar el backlog en lotes controlados.

---

## 8. Tests automatizados que validan estos invariantes

- **Estado del schedule** (jobname, schedule, ownership de `internal.call_cron_endpoint`): `supabase/tests/b7_1_schedule_crons.sql` (pgTAP, corre con `pnpm supabase:test`).
- **Concurrency del claim** (5 workers paralelos, cada order procesada exactamente una vez): `app/api/cron/expire-orders/route.concurrent.test.ts` y `app/api/cron/auto-close-orders/route.concurrent.test.ts` (Vitest contra Supabase local — requieren `pnpm supabase:start`).
- **Lógica del handler** (auth 401, RPC error 500, count + audit failures, ordering audit-before-publish): `route.test.ts` en cada carpeta (Vitest puro con mocks).

Si modificás la migración B7.1 o las RPCs B7.2/B7.3, esos tres niveles deben pasar antes del merge.
