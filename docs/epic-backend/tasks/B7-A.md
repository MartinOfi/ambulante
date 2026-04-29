# B7-A — Cron: runbook operativo + tests de integración concurrentes

> **Fase:** B7 — Cron & system jobs (pg_cron + pg_net + state machine)
> **Goal de la fase:** Dejar los timeouts del PRD §7.6 automatizados — `EXPIRADO` a 10min sin respuesta, auto-close a 2h de ACEPTADO — usando pg_cron que dispara Route Handlers Next.js con la state machine TS.
> **Acceptance criteria de la fase:** pg_cron tiene 2 schedules activos; los Route Handlers usan `SKIP LOCKED` para soportar workers concurrentes; tests de integración verifican correctness bajo concurrencia; existe un runbook para apagar/reactivar/auditar crons en incidentes.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ⚪ pending
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
- **Notas:** (se llena al cerrar)
- **Tareas originales fusionadas:** B7.4 (runbook), B7.5 (tests concurrentes).
