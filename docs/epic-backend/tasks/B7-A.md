# B7-A — Cron: runbook operativo + tests de integración concurrentes

> **Fase:** B7 — Cron & system jobs (pg_cron + pg_net + state machine)
> **Goal de la fase:** Dejar los timeouts del PRD §7.6 automatizados — `EXPIRADO` a 10min sin respuesta, auto-close a 2h de ACEPTADO — usando pg_cron que dispara Route Handlers Next.js con la state machine TS.
> **Acceptance criteria de la fase:** pg_cron tiene 2 schedules activos; los Route Handlers usan `SKIP LOCKED` para soportar workers concurrentes; tests de integración verifican correctness bajo concurrencia; existe un runbook para apagar/reactivar/auditar crons en incidentes.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ✅ done [owner: chat-2026-04-29, closed: 2026-04-29]
- **Por qué:** Cierra la fase B7 con los dos pendientes operacionales: (a) tests concurrentes que validen `SKIP LOCKED` (fácil de romper en refactors); (b) runbook para que en incidente alguien pueda apagar un cron sin un deploy. Las dos tareas comparten contexto (operación de los crons B7.2/B7.3) y se diseñan juntas.
- **Entregable:**
  1. `app/api/cron/expire-orders/route.concurrent.test.ts` y `app/api/cron/auto-close-orders/route.concurrent.test.ts` — lanzan 5 workers paralelos contra la misma ventana y verifican: cada order se procesa exactamente una vez, no hay deadlocks, throughput aceptable.
  2. `docs/runbooks/cron-management.md` con: apagar un schedule (`select cron.unschedule('expire-orders')`), reactivar, listar ejecuciones recientes (`cron.job_run_details`), inspeccionar errores, reprocesar ventanas perdidas.
- **Archivos:** `app/api/cron/expire-orders/route.concurrent.test.ts`, `app/api/cron/auto-close-orders/route.concurrent.test.ts`, `docs/runbooks/cron-management.md`.
- **Depends on:** B7.2, B7.3
- **Continues with:** —
- **Skill rules aplicables:** `lock-skip-locked`, `lock-deadlock-prevention`
- **REGISTRY:** `testing.md` (sección Cron concurrent tests).
- **Estimación:** M
- **Notas:**
  - Helper compartido extraído a `app/api/cron/_test-helpers/concurrent-fixtures.ts` (carpeta `_*` = privada en App Router); reusado por ambos `route.concurrent.test.ts`. Cada archivo crea su propio user+store con marker UUID en `beforeAll`; aserciones filtran por `store_id` para tolerar otras órdenes en la DB local compartida.
  - Patrón: 5 invocaciones paralelas de `POST(req)` vía `Promise.all`. Mocks deliberados: `createServiceRoleClient` (bypass del check `https://`), `SupabaseAuditLogService`, `eventBus`, `env`, `logger`. Cero mocks del RPC ni de la transición — la concurrencia se ejerce contra Postgres real.
  - Top-level await sobre `isLocalSupabaseReachable()` para resolver `describe.skipIf` en module-load. Ping a `/rest/v1/` (PostgREST root, estable); `/auth/v1/health` descartado por flakiness post-restart de Kong.
  - **Bug capturado:** `auto-close-orders/route.ts` validaba la respuesta del RPC con `z.string().datetime()` (sólo sufijo `Z`), pero PostgREST devuelve `timestamptz` con offset `+00:00`. Fix: `.datetime({ offset: true })` en `sent_at` y `accepted_at`. Los unit tests pasaban porque mockeaban con `Date.toISOString()` (formato `Z`). Es exactamente el tipo de divergencia que estos integration tests existen para detectar.
  - Runbook con 8 secciones: apagar/reactivar, inspeccionar `cron.job_run_details`, errores HTTP via `net._http_response`, reproceso manual (vía `internal.call_cron_endpoint` o curl), diagnóstico de transacciones lockeadas con `pg_stat_activity`, checklist de incidente.
  - REGISTRY actualizado: índice de `REGISTRY.md` (2 entradas + routing line) + nueva §17 en `REGISTRY-detail/testing.md`.
  - Code review B7-A: 0 CRITICAL / 0 HIGH / 2 MEDIUM / 4 LOW. Aplicados los fixes ≤5 líneas (`@vitest-environment node`, `cron.scheduled_jobs` → `cron.job` en checklist, line-numbers stale en §4.2 generalizados, claim "1000ms default" de pg_net suavizado a "consultar versión instalada"). Diferido a NT-30: cleanup error checking + reemplazo de `as` casts por type-guards en `concurrent-fixtures.ts`.
- **Tareas originales fusionadas:** B7.4 (runbook), B7.5 (tests concurrentes).
