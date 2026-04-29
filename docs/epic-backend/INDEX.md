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
| B3 | Boundaries de portabilidad (Repository + Facades + lint rule) | 4 | 4/4 | ✅ |
| B4 | Auth real (Supabase Auth + Google + magic link + middleware) | 4 | 4/4 | ✅ |
| B5 | Storage (buckets + RLS + upload helpers) | 4 | 4/4 | ✅ |
| B6 | Realtime wiring | 4 | 4/4 | ✅ |
| B7 | Cron & system jobs (pg_cron + pg_net + state machine) | 4 | 4/4 | ✅ |
| B8 | Web Push delivery (VAPID + subscriptions + triggers) | 4 | 4/4 | ✅ |
| B9 | Swap cliente (features Cliente consumen backend real) | 3 | 1/3 | 🟡 |
| B10 | Swap tienda (features Tienda consumen backend real) | 4 | 0/4 | ⚪ |
| B11 | Swap admin (features Admin consumen backend real) | 3 | 1/3 | 🟡 |
| B12 | Observability backend | 3 | 3/3 | ✅ |
| B13 | Hardening (rate limiting real, seed data, runbooks) | 2 | 1/2 | 🟡 |
| B14 | Deploy producción | 4 | 2/4 | 🟡 |

## Tareas pendientes (🟢 ready / ⚪ pending / 🔴 blocked)

| ID | Título | Estado | Depends on | Estim. | Skill rules | REGISTRY |
|---|---|---|---|---|---|---|
| B9-B | Cliente: flujo de pedido completo (cart→submit→tracking→history→cancel) | ⚪ | B9-A, B6.3 | XL | `lock-short-transactions`, `data-batch-inserts`, `data-pagination` | `features.md`. |
| B9-C | Cliente: push subscribe + profile | ⚪ | B8.1, B9-A | M | — | `features.md`. |
| B10-A | Tienda: onboarding completo (auth + alta + perfil con logo) | ⚪ | B4.4, B5.4, B5.2 | XL | — | `features.md`. |
| B10-B | Tienda: operación (availability + location + catálogo CRUD) | ⚪ | B3.1, B5.3, B10-A | XL | `data-batch-inserts` | `features.md`. |
| B10-C | Tienda: manejo de pedidos (inbox realtime + accept/reject/finalize) | ⚪ | B6.3, B9-B | L | `lock-short-transactions` | `features.md`. |
| B10-D | Tienda: analytics + push | ⚪ | B3.1, B8.1, B10-A | L | `query-composite-indexes` | `features.md`. |
| B11-A | Admin: dashboard KPIs + moderación (validación tiendas + content) | ⚪ | B3.1, B5.4 | XL | `query-composite-indexes`, `data-pagination` | `features.md`. |
| B11-B | Admin: audit log e-2-e (trigger + reader + writers) | ⚪ | B1.2, B3.1, B9-B, B10-C, B11-A, B11-C | L | `data-pagination` | `domain.md`, `features.md`. |
| B13-B | Hardening: seed data + runbooks (rollback + incident) | ⚪ | B1.2, B4.1, B0.3, B12-A | M | — | `testing.md` (Seed). |
| B14.2 | Pipeline CI: preview DB por PR (Supabase branching opcional) → approval → prod | ⚪ | B14.1, B0.4 | L | — | — |
| B14.4 | Go-live checklist + disaster recovery baseline | ⚪ | B14.2, B13-B | M | — | — |

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
| B5.3 | Upload helper con optimización de imagen | ✅ |
| B5.4 | Flow admin: revisar documentos de validación | ✅ |
| B6.1 | Habilitar Realtime + publicar tablas necesarias | ✅ |
| B6.2 | Implementación del facade `RealtimeService` | ✅ |
| B6.3 | Integración Realtime ↔ React Query | ✅ |
| B6.4 | Reconnect + backoff + test <5s | ✅ |
| B7.1 | Migración schedule_crons + helper pg_net | ✅ |
| B7.2 | Route Handler `/api/cron/expire-orders` con SKIP LOCKED | ✅ |
| B7.3 | Route Handler `/api/cron/auto-close-orders` | ✅ |
| B7-A | Cron: runbook + tests concurrentes | ✅ |
| B8.1 | VAPID keys + tabla + endpoint de subscribe | ✅ |
| B8.2 | Domain event listener: OrderStatusChanged → webpush | ✅ |
| B8.3 | Retry + dead subscription cleanup | ✅ |
| B8.4 | Test E2E del loop completo | ✅ |
| B11-C | Admin: user management | ✅ |
| B12.1 | Admin panel: top slow queries (pg_stat_statements reader) | ✅ |
| B12.4 | Supabase logs → Sentry breadcrumbs | ✅ |
| B12-A | Observability: structured logging + slow query alerts | ✅ |
| B13-A | Hardening: rate limiting in-DB + security smoke tests | ✅ |
| B14.1 | Crear proyecto Supabase Cloud + inyectar secrets | ✅ |
| B14.3 | Release-please integration | ✅ |
| B3.4 | CI check: no hay imports rotos | ✅ |
| B9-A | Cliente: onboarding + descubrimiento (auth + map + store detail) | ✅ |

## Re-shape vertical (2026-04-29)

El epic se reorganizó de **horizontal por capa** a **vertical por feature**. 32 tareas pendientes de B7/B9/B10/B11/B12/B13 se fusionaron en 14 tareas que entregan slices completos (auth + landing + map juntos, en vez de uno por chat). Las tareas originales viven en [`tasks/_archived/`](./tasks/_archived/) — útil cuando una nueva tarea referencia un campo `Por qué`/`Entregable` original.

Reglas del re-shape:
- **No tocar tareas done o en curso** — preservación total.
- **Cada tarea nueva entrega ~1500-2500 líneas con 1 review pass.** Si crece >2500, splittear (ver nota en `B9-B.md`).
- **El campo `Tareas originales fusionadas:` al final de cada `Bx-Y.md`** lista qué IDs viejos absorbió.
- B14 sin cambios (gates humanos secuenciales — fusionar reduce control).

## Cadenas (HISTÓRICO — auto-continuación eliminada)

Las cadenas C-B*-* del epic original requerían que un solo chat ejecutara múltiples tareas en serie.
**Eso se eliminó** — cada chat ejecuta UNA tarea. Al cerrar, `/b-finish` te imprime el comando exacto
para arrancar la siguiente.

| Cadena (histórica) | Secuencia | Estado |
|---|---|---|
| C-B1-schema | B1.1 → B1.2 → B1.3 → B1.4 → B1.5 | todas ✅ |
| C-B4-auth | B4.1 → B4.2 → B4.3 → B4.4 | todas ✅ |
| C-B6-realtime | B6.1 → B6.2 → B6.3 → B6.4 | todas ✅ |
| C-B7-cron | B7.1 → B7.2 → B7.3 | todas ✅ |
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
