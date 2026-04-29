# Epic Backend — INDEX

> **Source of truth de las tareas backend.** Leé este archivo + el archivo de TU tarea (`tasks/Bx.y.md`).
> **NUNCA** leas el directorio `tasks/` entero ni el legacy `docs/EPIC-BACKEND.md`.

## Cómo usar este índice

1. Buscá tu tarea en la tabla "Tareas pendientes" (✅ done están abajo, compactas).
2. Verificá que sus `Depends on:` estén ✅.
3. Abrí `tasks/<ID>.md` para los detalles de la tarea (entregable, archivos, skill rules, etc.).
4. Si tu tarea toca SQL/RLS → leé también [`convenciones.md`](./convenciones.md).
5. Si tu tarea toca `@supabase/*` o repos/facades → leé [`portabilidad.md`](./portabilidad.md).
6. Si tu tarea cita una decisión BD-N → leé [`decisiones.md`](./decisiones.md).

> **Histórico de cierres:** [`changelog.md`](./changelog.md).

## Estado de fases

| Fase | Nombre | Tareas | Done | Estado |
|---|---|---|---|---|
| B0 | Setup de Supabase local + CLI + entorno | 4 | 4/4 | ✅ |
| B1 | Schema core + extensiones + índices + monitoring foundations | 5 | 5/5 | ✅ |
| B2 | RLS policies + pgTAP tests + performance RLS | 5 | 5/5 | ✅ |
| B3 | Boundaries de portabilidad (Repository + Facades + lint rule) | 4 | 3/4 | 🟡 |
| B4 | Auth real (Supabase Auth + Google + magic link + middleware) | 4 | 4/4 | ✅ |
| B5 | Storage (buckets + RLS + upload helpers) | 4 | 2/4 | 🟡 |
| B6 | Realtime wiring | 4 | 3/4 | 🟡 |
| B7 | Cron & system jobs (pg_cron + pg_net + state machine) | 5 | 2/5 | 🟡 |
| B8 | Web Push delivery (VAPID + subscriptions + triggers) | 4 | 3/4 | 🟡 |
| B9 | Swap cliente (features Cliente consumen backend real) | 8 | 0/8 | ⚪ |
| B10 | Swap tienda (features Tienda consumen backend real) | 8 | 0/8 | ⚪ |
| B11 | Swap admin (features Admin consumen backend real) | 7 | 0/7 | ⚪ |
| B12 | Observability backend | 4 | 1/4 | 🟡 |
| B13 | Hardening (rate limiting real, seed data, runbooks) | 5 | 0/5 | ⚪ |
| B14 | Deploy producción | 4 | 0/4 | ⚪ |

## Tareas pendientes (🟢 ready / ⚪ pending / 🔴 blocked)

| ID | Título | Estado | Depends on | Estim. | Skill rules | REGISTRY |
|---|---|---|---|---|---|---|
| B3.4 | CI check: no hay imports rotos | ⚪ | B3.3 | S | — | — |
| B5.3 | Upload helper con optimización de imagen | ⚪ | B5.2 | M | — | `infra.md` (sección Utils). |
| B5.4 | Flow admin: revisar documentos de validación | ⚪ | B5.2 | M | — | `features.md`. |
| B6.4 | Reconnect + backoff + test <5s | ⚪ | B6.3 | M | — | `testing.md`. |
| B7.3 | Route Handler `/api/cron/auto-close-orders` | ⚪ | B7.2 | M | `lock-skip-locked`, `lock-short-transactions` | — |
| B7.4 | Runbook: cómo desactivar / reactivar / auditar un cron | ⚪ | B7.3 | S | — | — |
| B7.5 | Tests de integración concurrentes | ⚪ | B7.2, B7.3 | M | `lock-skip-locked`, `lock-deadlock-prevention` | `testing.md`. |
| B8.3 | Retry + dead subscription cleanup | ✅ | B8.2 | M | — | — |
| B8.4 | Test E2E del loop completo | ⚪ | B8.3 | L | — | `testing.md`. |
| B9.1 | Swap auth en features/auth + landing | ⚪ | B4.4 | M | — | `features.md`. |
| B9.2 | Swap stores nearby + feed del mapa | ⚪ | B3.1, B6.3 | L | `data-n-plus-one`, `query-index-types` | `features.md`. |
| B9.3 | Swap store detail + products | ⚪ | B3.1, B5.2 | M | — | `features.md`. |
| B9.4 | Swap cart + submit order (con snapshot + transacción corta) | ⚪ | B3.1 | L | `lock-short-transactions`, `data-batch-inserts` | `features.md`. |
| B9.5 | Swap order tracking + realtime subscription | ⚪ | B6.3 | M | — | `features.md`. |
| B9.6 | Swap order history | ⚪ | B3.1 | M | `data-pagination` | — |
| B9.7 | Swap cancel flow | ⚪ | B9.4 | S | — | — |
| B9.8 | Swap push subscribe del cliente + profile | ⚪ | B8.1 | M | — | `features.md`. |
| B10.1 | Swap auth + onboarding tienda | ⚪ | B4.4, B5.4 | L | — | `features.md`. |
| B10.2 | Swap availability toggle + location publishing | ⚪ | B3.1 | L | `data-batch-inserts` (si se buffering) | `features.md`. |
| B10.3 | Swap catálogo CRUD + image upload | ⚪ | B3.1, B5.3 | L | — | `features.md`. |
| B10.4 | Swap incoming orders inbox + realtime | ⚪ | B6.3 | M | — | `features.md`. |
| B10.5 | Swap accept/reject/finalize state transitions | ⚪ | B9.4 | L | `lock-short-transactions` | — |
| B10.6 | Swap store profile + logo upload | ⚪ | B5.2 | M | — | `features.md`. |
| B10.7 | Swap analytics básico de tienda | ⚪ | B3.1 | M | `query-composite-indexes` | `features.md`. |
| B10.8 | Swap push subscribe de tienda | ⚪ | B8.1 | S | — | `features.md`. |
| B11.1 | Swap dashboard KPIs | ⚪ | B3.1 | M | `query-composite-indexes`, `data-pagination` | `features.md`. |
| B11.2 | Swap store validation queue | ⚪ | B5.4 | M | — | `features.md`. |
| B11.3 | Swap content moderation | ⚪ | B3.1 | M | — | `features.md`. |
| B11.4 | Swap audit log reader | ⚪ | B3.1 | M | `data-pagination` | `features.md`. |
| B11.5 | Swap user management | ⚪ | B3.1 | M | — | `features.md`. |
| B11.6 | Ensure audit_log append-only enforcement (trigger) | ⚪ | B1.2 | S | — | `domain.md`. |
| B11.7 | Swap audit_log writer en Server Actions críticas | ⚪ | B11.6, B9.4, B10.5 | M | — | `domain.md`. |
| B12.1 | Admin panel: top slow queries (pg_stat_statements reader) | ⚪ | B1.1 | M | `monitor-pg-stat-statements` | `features.md`. |
| B12.2 | Slow query alerts → Sentry | ⚪ | B12.1, B7.1 | M | `monitor-pg-stat-statements` | — |
| B12.3 | Structured server-side logging con request IDs | ⚪ | — | M | — | `data.md` (sección Logger). |
| B12.4 | Supabase logs → Sentry breadcrumbs | ✅ | — | S | — | — |
| B13.1 | Rate limiting in-DB (leaky bucket con tabla + RLS) | ⚪ | B3.1 | L | `lock-short-transactions`, `lock-advisory` | `data.md`. |
| B13.2 | Seed data fixtures para dev | ⚪ | B1.2, B4.1 | M | — | `testing.md` (sección Seed data). |
| B13.3 | Runbook: rollback de migración | ⚪ | B0.3 | S | — | — |
| B13.4 | Runbook: incident response | ⚪ | B12.3 | S | — | — |
| B13.5 | Security smoke tests en CI | ⚪ | B13.1, B2.3 | L | — | `testing.md`. |
| B14.1 | Crear proyecto Supabase Cloud + inyectar secrets | ⚪ | — | M | `conn-pooling` | — |
| B14.2 | Pipeline CI: preview DB por PR (Supabase branching opcional) → approval → prod | ⚪ | B14.1, B0.4 | L | — | — |
| B14.3 | Release-please integration | ⚪ | — | S | — | — |
| B14.4 | Go-live checklist + disaster recovery baseline | ⚪ | B14.2, B13.4 | M | — | — |

## Tareas done (compactas)

| ID | Título | Estado |
|---|---|---|
| B0.1 | Supabase CLI + scripts pnpm + Docker baseline | ✅ |
| B0.2 | Env schema: URLs separadas (pooler vs directo) + secretos de backend | ✅ |
| B0.3 | Template de migraciones + convention doc | ✅ |
| B0.4 | CI de migraciones + drift check + audit de FK sin índice | ✅ |
| B1.1 | Extensiones habilitadas | ✅ |
| B1.2 | Tablas core del dominio | ✅ |
| B1.3 | Índices compuestos para queries conocidas | ✅ |
| B1.4 | Índices parciales para filtros estables | ✅ |
| B1.5 | Audit de FK sin índice + test CI | ✅ |
| B2.1 | Policies RLS de todas las tablas del dominio | ✅ |
| B2.2 | Helper functions security definer para cross-tenant checks | ✅ |
| B2.3 | pgTAP test suite para policies | ✅ |
| B2.4 | Benchmark de performance RLS | ✅ |
| B2.5 | Lint SQL check de patrones RLS prohibidos | ✅ |
| B3.1 | Repositories Supabase (implementaciones de F3.4) | ✅ |
| B3.2 | Facades Auth + Storage + Realtime + Push (stubs Supabase) | ✅ |
| B3.3 | ESLint `no-restricted-imports` para `@supabase/*` | ✅ |
| B4.1 | Configurar providers en supabase/config.toml | ✅ |
| B4.2 | `@supabase/ssr` wiring + middleware.ts swap | ✅ |
| B4.3 | Implementación completa del facade `AuthService` | ✅ |
| B4.4 | Callbacks OAuth + confirm email + error pages | ✅ |
| B5.1 | Crear buckets + RLS de Storage | ✅ |
| B5.2 | Implementación del facade `StorageService` | ✅ |
| B6.1 | Habilitar Realtime + publicar tablas necesarias | ✅ |
| B6.2 | Implementación del facade `RealtimeService` | ✅ |
| B6.3 | Integración Realtime ↔ React Query | ✅ |
| B7.1 | Migración schedule_crons + helper pg_net | ✅ |
| B7.2 | Route Handler `/api/cron/expire-orders` con SKIP LOCKED | ✅ |
| B8.1 | VAPID keys + tabla + endpoint de subscribe | ✅ |
| B8.2 | Domain event listener: OrderStatusChanged → webpush | ✅ |
| B8.3 | Retry + dead subscription cleanup | ✅ |

## Cadenas (HISTÓRICO — auto-continuación eliminada)

Las cadenas C-B*-* del epic original requerían que un solo chat ejecutara múltiples tareas en serie.
**Eso se eliminó** — cada chat ejecuta UNA tarea. Al cerrar, `/b-finish` te imprime el comando exacto
para arrancar la siguiente.

| Cadena (histórica) | Secuencia | Estado |
|---|---|---|
| C-B1-schema | B1.1 → B1.2 → B1.3 → B1.4 → B1.5 | todas ✅ |
| C-B4-auth | B4.1 → B4.2 → B4.3 → B4.4 | todas ✅ |
| C-B6-realtime | B6.1 → B6.2 → B6.3 → B6.4 | B6.4 pendiente |
| C-B7-cron | B7.1 → B7.2 → B7.3 | B7.3 pendiente |
| C-B8-push | B8.1 → B8.2 → B8.3 | todas ✅ (B8.4 independiente) |

Los campos `Continues with:` de cada `tasks/Bx.y.md` siguen indicando la continuación lógica;
ahora son **sugerencias** para `/b-finish`, no auto-claims.

## Sub-archivos del epic (carga selectiva)

- [`convenciones.md`](./convenciones.md) — invariantes SQL (snake_case, PKs, FKs+índice, RLS `(select auth.uid())`, transacciones cortas, SKIP LOCKED)
- [`portabilidad.md`](./portabilidad.md) — directorios permitidos para `@supabase/*`
- [`decisiones.md`](./decisiones.md) — BD-1 a BD-8
- [`changelog.md`](./changelog.md) — histórico

## Archivos por tarea

Cada `tasks/Bx.y.md` contiene: contexto de fase (goal + acceptance), bloque completo de la tarea
(estado, por qué, entregable, archivos, depends on, continues with, skill rules, REGISTRY, estimación, notas).

Convención de claim/cierre del bloque (igual que el epic original):
- Al claimear: `Estado: 🟡 in-progress [owner: chat-<fecha>, started: <hora>]` + commit `chore(epic-backend): claim Bx.y`.
- Al cerrar: `Estado: ✅ done [owner: chat-<fecha>, closed: <fecha>]` + completar `Notas:` + commit del cierre.
