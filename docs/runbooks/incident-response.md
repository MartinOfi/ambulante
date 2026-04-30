# Runbook: Incident Response

Guía de triage y respuesta a incidentes de producción.
Copiá este runbook al iniciar cada incidente y completá las secciones marcadas con `[ ]`.

---

## Severidades

| Nivel | Criterio                                                      | Tiempo de respuesta |
|-------|---------------------------------------------------------------|---------------------|
| P1    | Servicio caído totalmente / pérdida de datos en curso        | < 15 min            |
| P2    | Feature crítica degradada (pedidos, mapa, auth)              | < 1 hora            |
| P3    | Feature secundaria afectada / error intermitente             | < 4 horas           |
| P4    | Cosmético / UX menor                                         | Próximo sprint      |

---

## Paso 1 — Detección y clasificación

```
[ ] Hora de detección: _______________
[ ] Reportado por: _______________
[ ] Descripción del síntoma: _______________
[ ] Severidad asignada: P1 / P2 / P3 / P4
[ ] Avisé al equipo en #backend-incidents: sí / no
```

---

## Paso 2 — Triage rápido (< 5 min para P1/P2)

### 2.1 Ver conexiones activas y queries lentas

```sql
-- Conexiones activas (ejecutar en Supabase Studio → SQL Editor)
select pid, usename, application_name, state, wait_event_type, wait_event,
       now() - query_start as duration, left(query, 120) as query_preview
from pg_stat_activity
where state != 'idle'
  and pid != pg_backend_pid()
order by duration desc nulls last
limit 20;
```

```sql
-- Queries lentas (> 1 segundo corriendo ahora mismo)
select pid, now() - query_start as duration,
       wait_event_type, wait_event,
       left(query, 200) as query_preview
from pg_stat_activity
where state = 'active'
  and query_start < now() - interval '1 second'
order by duration desc;
```

### 2.2 Ver pool de conexiones

En el panel de Supabase Cloud: **Database → Connection pooling**.

Señales de alerta:
- Pool > 80% ocupado → posible saturación de conexiones.
- Conexiones en estado `idle in transaction` por > 30s → transacciones colgadas.

```sql
-- Matar una conexión específica (reemplazá <pid>)
select pg_terminate_backend(<pid>);

-- Matar todas las idle-in-transaction de más de 30s (usar con cuidado en P1)
select pg_terminate_backend(pid)
from pg_stat_activity
where state = 'idle in transaction'
  and now() - query_start > interval '30 seconds';
```

### 2.3 Ver errores recientes en Sentry

URL: configurada en variables de entorno como `NEXT_PUBLIC_SENTRY_DSN`.

Filtros útiles:
- `environment:production` + `level:error` + últimos 30 min.
- Agrupar por `issue` para ver el error más frecuente.

### 2.4 Ver logs de Edge Functions (si aplica)

```bash
npx supabase functions logs <nombre-función> --linked
```

---

## Paso 3 — Diagnóstico por síntoma

### Caso A: Usuarios no pueden hacer login

1. Verificar que Supabase Auth esté funcionando: panel → Auth → Users.
2. Revisar logs de Auth: panel → Logs → Auth Logs.
3. Verificar que las variables de entorno `SUPABASE_URL` y `SUPABASE_ANON_KEY` no cambiaron en Vercel.
4. Si Auth está caído → escalá a Supabase soporte. Status: status.supabase.com.

### Caso B: Mapa no muestra tiendas

```sql
-- Cuántas tiendas tienen current_location seteada
select count(*) filter (where current_location is not null) as con_ubicacion,
       count(*) as total
from public.stores where available = true;
```

Si `con_ubicacion = 0` → las tiendas no están actualizando su ubicación.
Si `con_ubicacion > 0` pero el mapa está vacío → problema en el frontend o en la query RPC.

```sql
-- Testear find_stores_nearby directamente (Palermo como referencia)
select * from public.find_stores_nearby(-34.5779, -58.4328, 5000);
```

### Caso C: Pedidos no pasan de estado

```sql
-- Ver órdenes atascadas (más de 5 min en enviado/recibido sin moverse)
select public_id, status, created_at,
       now() - created_at as edad,
       expires_at
from public.orders
where status in ('enviado', 'recibido')
  and created_at < now() - interval '5 minutes'
order by created_at;
```

Si hay muchas → posible problema con el cron de expiración.

```sql
-- Verificar que pg_cron está corriendo
select jobname, schedule, active, jobid
from pg_cron.job;

-- Ver últimas corridas del cron de expiración
select jobid, runid, job_pid, database, username, command,
       status, return_message, start_time, end_time
from pg_cron.job_run_details
where jobid = (select jobid from pg_cron.job where jobname = 'expire-orders')
order by start_time desc
limit 10;
```

### Caso D: Error 500 en endpoints de escritura (Server Actions)

1. Buscar en Sentry los stack traces de las últimas horas.
2. Verificar que la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` siga activa en Vercel.
3. Testear el RPC desde Studio:

```sql
-- Ejemplo: testear create_order_with_items como si fuera el service role
-- (reemplazá con los parámetros correctos)
select public.create_order_with_items(
  '10000000-0000-0000-0000-000000000001'::uuid,
  '[{"productPublicId": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'::jsonb,
  null::uuid,
  null::text
);
```

### Caso E: Base de datos lenta (latencia > 500ms en queries normales)

```sql
-- Top 10 queries más lentas (requiere pg_stat_statements)
select query,
       calls,
       round(total_exec_time / calls) as avg_ms,
       round(total_exec_time) as total_ms,
       rows
from pg_stat_statements
where calls > 10
order by avg_ms desc
limit 10;
```

Si hay una query sin índice consumiendo mucho → analizarla con `EXPLAIN (ANALYZE, BUFFERS)`.

---

## Paso 4 — Acciones de contención

| Acción                        | Cuándo usarla                                    | Comando / lugar                    |
|-------------------------------|--------------------------------------------------|------------------------------------|
| Matar conexiones colgadas     | Pool saturado, idle-in-transaction > 30s         | `pg_terminate_backend(pid)` (§2.2) |
| Rollback de migración         | Migración reciente correlaciona con el incidente | ver `migration-rollback.md`        |
| Revertir deploy en Vercel     | Regression introducida en último deploy          | Vercel Dashboard → Deployments → Redeploy anterior |
| Deshabilitar feature flag     | Feature nueva causando errores                   | Vercel env vars → cambiar flag → redeploy |
| Pausar cron de expiración     | Cron está spammeando errores o bloqueando rows   | `update pg_cron.job set active = false where jobname = 'expire-orders'` |

---

## Paso 5 — Comunicación al usuario

Para incidentes P1/P2, publicar un mensaje en la app o banner en la landing.

**Plantilla de mensaje de degradación:**

```
Estamos experimentando dificultades técnicas que pueden afectar [describe la funcionalidad].
Nuestro equipo está trabajando en una solución.
Última actualización: [hora].
```

**Plantilla de resolución:**

```
El servicio fue restaurado. Pedimos disculpas por los inconvenientes.
Si experimentás algún problema adicional, escribinos a [contacto].
```

---

## Paso 6 — Escalada

| Cuándo escalar                                       | A quién                         |
|------------------------------------------------------|---------------------------------|
| Base de datos caída > 5 min                          | Supabase soporte (soporte urgente en panel) |
| Pérdida de datos confirmada                          | Supabase soporte + CTO          |
| Incidente de seguridad (leak de datos, auth bypasseado) | CTO + revisar `docs/runbooks/audit-rules.md` |
| No hay resolución en el SLA del nivel (P1: 15 min)  | CTO                             |

---

## Plantilla de post-mortem

Completar dentro de las 48h de cerrado el incidente.
Guardar en `docs/post-mortems/<YYYY-MM-DD>-<slug>.md`.

```markdown
# Post-mortem: <título del incidente>

**Fecha:** YYYY-MM-DD
**Severidad:** P1 / P2 / P3
**Duración:** HH:MM – HH:MM (X minutos)
**Responsable del post-mortem:** @nombre

## Resumen ejecutivo (1 párrafo)

## Línea de tiempo

| Hora  | Evento |
|-------|--------|
| HH:MM | Detección del incidente |
| HH:MM | Inicio de triage |
| HH:MM | Causa raíz identificada |
| HH:MM | Contención aplicada |
| HH:MM | Servicio restaurado |

## Causa raíz

## Impacto

- Usuarios afectados: ~X
- Features degradadas: X, Y
- Datos afectados: sí / no (si sí, detallá)

## Qué salió bien

## Qué salió mal

## Acciones de seguimiento

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| ...    | @nombre     | YYYY-MM-DD   |
```

---

## Referencias rápidas

- Supabase status: https://status.supabase.com
- Panel de producción: Supabase Cloud → proyecto ambulante-prod
- Vercel deployments: Vercel Dashboard → ambulante
- Runbook de rollback: `docs/runbooks/migration-rollback.md`
- Reglas de auditoría: `docs/runbooks/audit-rules.md`
