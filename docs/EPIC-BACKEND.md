# EPIC — Backend Ambulante (Supabase)

> **Objetivo:** Implementar el backend completo de Ambulante sobre Supabase (Postgres + Auth + Realtime + Storage + PostGIS) y reemplazar los servicios mock del frontend por implementaciones reales, sin perder portabilidad ante una futura migración.
>
> **Fuente de verdad del producto:** [`PRD.md`](./PRD.md)
> **Reglas de código y estructura:** [`../CLAUDE.md`](../CLAUDE.md)
> **Epic frontend (histórico, ya cerrado):** [`EPIC-ARCHITECTURE.md`](./EPIC-ARCHITECTURE.md)
> **Skill obligatoria para SQL / schema / RLS / índices:** [`.claude/skills/supabase-postgres-best-practices/`](../.claude/skills/supabase-postgres-best-practices/)

---

## Cómo usar este documento

Este archivo es **documento vivo**. Cualquier chat o agente puede tomar una tarea, ejecutarla y actualizar el estado acá mismo. El objetivo es permitir **trabajo paralelo** sin pisarse entre sí.

### Protocolo para tomar una tarea

1. **Abrir este archivo** y buscar tareas con estado `🟢 ready` (todas las dependencias `✅ done`).
2. **Marcar la tarea como `🟡 in-progress`** y anotar `[owner]: nombre-del-chat-o-fecha` en la misma línea.
3. **Ejecutar la tarea** respetando el entregable definido.
4. Al terminar:
   - Marcar como `✅ done`.
   - Actualizar el campo `Notas:` con decisiones tomadas y archivos creados.
   - Si la tarea tocó `shared/` → actualizar `shared/REGISTRY.md` y el detail file correspondiente en el mismo commit (§5 del CLAUDE.md).
   - Si la tarea reveló subtareas nuevas o mejoras futuras → agregarlas a `docs/NEXT-TASK.md` (no acá, para no ensuciar el epic).
5. **Nunca** tomar una tarea `🔴 blocked` sin resolver la decisión pendiente que la bloquea.

### Leyenda de estados

| Símbolo | Estado | Significado |
|---|---|---|
| ⚪ | `pending` | Todavía no lista (dependencias sin resolver) |
| 🟢 | `ready` | Todas las dependencias completas — puede arrancarse |
| 🟡 | `in-progress` | Alguien la está haciendo — no tocar |
| ✅ | `done` | Terminada, entregable verificado |
| 🔴 | `blocked` | Esperando una decisión del usuario |
| ⏸️ | `deferred` | Se mueve a un release futuro (va a NEXT-TASK.md) |

### Estimación de esfuerzo

| Sigla | Rango |
|---|---|
| **S** | < 2h |
| **M** | 2h–1 día |
| **L** | 1–3 días |
| **XL** | > 3 días (candidata a dividirse) |

### Decisiones pendientes globales

Antes de que cualquier fase dependiente se destrabe, estas decisiones deben estar tomadas. Al arranque de este epic, **todas las decisiones de arquitectura están resueltas** — las dejo listadas para que el registro quede claro:

- [x] **Backend stack:** ✅ Supabase (Postgres + Auth + Realtime + Storage + PostGIS). Heredado de EPIC-ARCHITECTURE DP-1.
- [x] **Auth provider:** ✅ Supabase Auth con email/password + magic link + Google OAuth. Apple OAuth queda en NEXT-TASK.md.
- [x] **Entornos:** ✅ Supabase local (Docker) para dev + Supabase Cloud para prod. Staging se suma cuando exista equipo (ver NEXT-TASK.md).
- [x] **Migrations format:** ✅ SQL plano, `YYYYMMDDhhmmss_<name>.sql`, versionado en `supabase/migrations/`.
- [x] **Patrón de acceso:** ✅ Híbrido — reads client-direct con RLS, writes server-side via Server Actions / Route Handlers con service role.
- [x] **Portabilidad:** ✅ Repository + Facade pattern; `@supabase/*` solo permitido en 3 directorios (ver §Portabilidad).
- [x] **Cron / system jobs:** ✅ `pg_cron + pg_net` dispara HTTP → Route Handler Next.js con la state machine TS (ver B7).
- [x] **Storage scope:** ✅ Fotos de productos + logos de tienda + documentos de validación. Avatares de usuario en NEXT-TASK.md.
- [x] **Push delivery:** ✅ En este epic (B8). VAPID keys + endpoint + domain event listener.

---

## Lectura obligatoria al tomar cualquier tarea

En orden, con Read tool (no de memoria):

1. **`CLAUDE.md`** — completo, con énfasis en §4 (arquitectura), §5 (REGISTRY), §6 (reglas de código), §7 (invariantes), §10 (backend).
2. **`docs/PRD.md`** — secciones relevantes al dominio de la tarea.
3. **Este archivo** — bloque de la tarea, dependencias, cadena, y la sección "Convenciones" + "Reglas de portabilidad".
4. **`.claude/skills/supabase-postgres-best-practices/SKILL.md`** y las rules específicas listadas en el campo `Skill rules aplicables:` de la tarea. **Regla dura:** no se escribe SQL ni RLS sin haber leído las rules aplicables.
5. **`shared/REGISTRY.md`** — índice rápido + routing. Luego el detail file de la categoría de la tarea (`ui.md`, `data.md`, `domain.md`, `infra.md`, `features.md`, `testing.md`) si la tarea toca `shared/`.

---

## Cómo leer dependencias y paralelismo

Este epic tiene dos niveles de información sobre el orden:

1. **Dependencias explícitas** en cada tarea (`Depends on: B2.3, B3.1`).
2. **Waves por fase**: grupos de tareas que pueden arrancarse al mismo tiempo en **chats distintos**.

### Regla general

> Dos tareas se pueden hacer **en paralelo** si ninguna depende (directa o transitivamente) de la otra, y si no escriben los mismos archivos.

### Waves

Dentro de una fase, las tareas se agrupan en ondas (A, B, C…). Cada onda tiene un **gating** que define el momento más temprano en que sus tareas pueden empezar. Las ondas anteriores **siguen vivas en sus chats** mientras vos abrís la siguiente (ver `PARALLEL-EXECUTION-BACKEND.md` para el detalle operativo).

### Cadenas de auto-continuación

Algunas tareas tienen un **sucesor natural** que se ejecuta en el **mismo chat** apenas termine la actual. Aparecen en el epic como `Continues with: Bx.y`.

Cadenas definidas en este epic:

| Cadena | Secuencia | Descripción |
|---|---|---|
| **C-B1-schema** | B1.1 → B1.2 → B1.3 → B1.4 → B1.5 | 1 chat ejecuta extensiones + tablas + índices + audit FK |
| **C-B4-auth** | B4.1 → B4.2 → B4.3 → B4.4 | 1 chat, auth en serie (config → middleware → facade → flows) |
| **C-B6-realtime** | B6.1 → B6.2 → B6.3 → B6.4 | 1 chat, realtime end-to-end |
| **C-B7-cron** | B7.1 → B7.2 → B7.3 | 1 chat, scheduler + route handlers |
| **C-B8-push** | B8.1 → B8.2 → B8.3 | 1 chat, push delivery end-to-end |

---

## Convenciones (aplican a todas las tareas)

### IDs y nombres

- **Task IDs:** prefijo `B` para todo el epic de backend. Formato `Bx.y` (ej: `B0.1`, `B2.3`, `B12.4`). Nunca colisiona con los `F*` del frontend epic.
- **Branches:** `feat/b<task-id>-<slug>` (ej: `feat/b1-2-core-tables`).
- **Worktrees:** `../ambulante-b<task-id>` (ej: `../ambulante-b1-2`).
- **Cadenas:** prefijo `C-B*`.

### Convenciones SQL (tomadas de `supabase-postgres-best-practices`)

Estas seis reglas son **invariantes del epic** — cualquier tarea que escriba SQL debe respetarlas. El código review rechaza PRs que las violen.

| # | Regla | Rule de la skill que la respalda | Verificación |
|---|---|---|---|
| 1 | `snake_case` lowercase para tablas, columnas, índices, constraints, funciones. Prohibido mixed-case / comillas dobles. | `schema-lowercase-identifiers` | PR review |
| 2 | Primary keys `bigint generated always as identity` por default. UUIDv7 solo para IDs expuestos al cliente con justificación documentada. Nunca `serial`. Nunca `uuid_generate_v4()` como PK. | `schema-primary-keys` | PR review + test automatizado (B1.5) |
| 3 | Toda FK con índice explícito en la misma migración que la crea. | `schema-foreign-key-indexes` | Test CI en B1.5 (query contra `pg_constraint`/`pg_index`, fail si hay FK sin índice) |
| 4 | RLS policies usan `(select auth.uid())`, nunca `auth.uid()` directo. | `security-rls-performance` | Lint SQL en B2.5 |
| 5 | Transacciones cortas, sin I/O externo dentro. Efectos secundarios (push, emails, webhooks) via domain events post-commit. | `lock-short-transactions` | PR review |
| 6 | Jobs que reclaman filas de una queue (cron expirations, push retries) usan `FOR UPDATE SKIP LOCKED`. | `lock-skip-locked` | PR review + test concurrente (B7.5) |

### Formato de bloque de tarea

```
### Bx.y — Título corto
- **Estado:** ⚪ pending
- **Por qué:** 1-2 líneas de motivo.
- **Entregable:** lo que queda al terminar (archivos, migraciones, tests).
- **Archivos:** paths absolutos o relativos al repo.
- **Depends on:** IDs de tareas (o "—").
- **Continues with:** ID de la siguiente tarea en la cadena (o "—").
- **Skill rules aplicables:** nombres de rules del directorio references/ de la skill.
- **REGISTRY:** qué detail files de shared/REGISTRY-detail/ hay que actualizar (o "—" si no toca shared/).
- **Estimación:** S/M/L/XL.
- **Notas:** (se llenan al cerrar)
```

---

## Reglas de portabilidad (anexo permanente)

Este epic se diseñó para **no encadenar el código a Supabase** más de lo estrictamente necesario. Las siguientes reglas son **invariantes transversales** y aplican a todas las tareas.

### Directorios donde `@supabase/*` está permitido

Solo estos tres lugares pueden importar del SDK:

1. **`shared/repositories/supabase/*.ts`** — implementaciones Supabase de las interfaces de F3.4 (`OrdersRepository`, `StoresRepository`, `ProductsRepository`, `UsersRepository`, `AuditLogRepository`, etc.).
2. **`shared/services/*.supabase.ts`** — implementaciones Supabase de los facades (`auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`, `push.supabase.ts`).
3. **`app/api/cron/**/route.ts`** — Route Handlers de jobs del sistema que corren SQL directo por performance (con SKIP LOCKED).

### Facades obligatorios

Todo feature / componente / hook que necesite backend lo consume a través de uno de estos cuatro facades. Nunca del SDK.

| Facade | Firma pública | Implementaciones |
|---|---|---|
| `AuthService` | `signIn`, `signInWithMagicLink`, `signInWithGoogle`, `signOut`, `getSession`, `getUser`, `onAuthStateChange` | mock (hoy) → `auth.supabase.ts` (B4) |
| `StorageService` | `upload(bucket, path, file)`, `getPublicUrl(bucket, path)`, `getSignedUrl(bucket, path, expiresIn)`, `remove(bucket, paths)` | mock → `storage.supabase.ts` (B5) |
| `RealtimeService` | `subscribe(channel, config, handler)`, `unsubscribe(channel)`, `broadcast(channel, event, payload)` | mock → `realtime.supabase.ts` (B6) |
| `PushService` | `requestPermission()`, `subscribeUser(userId, endpoint)`, `unsubscribeUser(userId)`, `sendToUser(userId, payload)` | mock → `push.supabase.ts` (B8) |

### Regla de CI

Un test (B3.4) falla el CI si encuentra `from "@supabase` en cualquier archivo que no esté en los 3 directorios permitidos. Esto convierte la disciplina en estructural.

### Migration playbook — ¿qué cuesta salir de Supabase?

Esta tabla se mantiene al día por cada PR que toque backend. Si el costo crece silenciosamente, es señal de que se rompió la disciplina.

| Capa | Lock-in actual | Si migramos a X | Costo estimado |
|---|---|---|---|
| Postgres schema + índices + PostGIS | Cero (SQL estándar) | Cualquier Postgres (RDS, Neon, self-hosted) | **Gratis** — las migraciones corren tal cual |
| Lógica de dominio (state machine, snapshots, events) | Cero (vive en `shared/domain/`) | Cualquier backend | **Gratis** |
| React Query hooks + componentes | Cero (consumen facades) | Cualquier backend | **Gratis** |
| Repositories Supabase | Alto pero concentrado | Reimplementar `shared/repositories/<nuevo>/` | **~5 archivos, 2-3 días** |
| Facade Auth | Alto (flows de OAuth, cookies, session) | Auth.js / Clerk / custom | **~5 días** — incluye migrar datos de users |
| Facade Realtime | Alto (sintaxis de channels) | Ably / Pusher / SSE custom | **~3 días** |
| Facade Storage | Bajo (signed URLs estándar) | S3 / R2 / GCS | **~1 día** |
| Facade Push | Medio (solo el trigger cambia) | Webhook externo → webpush lib sigue igual | **~1 día** |
| RLS policies | Alto (sintaxis `auth.uid()` propia) | JWT custom + security definer functions | **~3 días** |
| pg_cron jobs | Bajo (extensión estándar) | Cualquier Postgres con pg_cron, o mover a Vercel Cron | **~1 día** |
| **TOTAL rewrite** | | | **~3 semanas** |

---

## Dependency map (alto nivel)

```
B0 ──► B1 ──► B2 ──► B3 ──┬──► B4 ──► B9 (cliente)
                          ├──► B5 ──► B10 (tienda)
                          ├──► B6 ──► B11 (admin)
                          ├──► B7
                          └──► B8
                B9+B10+B11 ──► B12 ──► B13 ──► B14
```

### Reglas de paralelismo a nivel fase

| # | Regla | Implicación práctica |
|---|---|---|
| 1 | **B0 y B1 son bloqueantes totales** | Nada puede correr hasta que ambos estén ✅. |
| 2 | **B2 y B3 pueden correr en paralelo después de B1** | Un chat hace RLS (B2), otro los boundaries (B3). Son archivos distintos. |
| 3 | **B4-B8 son un abanico paralelo post-B3** | Hasta **5 chats concurrentes** (uno por facade). |
| 4 | **B9-B11 son trillizas paralelas post-B4+B5+B6** | 3 chats — cliente, tienda, admin — son features aislados que comparten solo facades (read-only desde su óptica). |
| 5 | **B12-B14 serializan** | Observabilidad → hardening → deploy. Secuenciales. |

**Pico teórico de paralelismo:** ~8 chats concurrentes durante la ventana B4-B8 + B9 arrancando.

---

# FASE B0 — Setup de Supabase local + CLI + entorno

**Goal:** Dejar el repo listo para que cualquier chat/dev corra Supabase completo en su máquina con un solo comando y sepa cómo versionar migraciones sin pisarse.
**Acceptance criteria:** `pnpm supabase:start` levanta Postgres + Auth + Realtime + Storage en Docker; `pnpm supabase:reset` aplica todas las migraciones desde cero; CI corre las mismas migraciones contra una instancia efímera; env vars de Supabase están tipadas con Zod.

### B0.1 — Supabase CLI + scripts pnpm + Docker baseline
- **Estado:** ✅ done
- **Por qué:** Sin el CLI instalado y los scripts listos, ningún chat puede empezar a trabajar con backend. Es el bloqueo raíz.
- **Entregable:** `supabase/` directory creado con `supabase init`; scripts `pnpm supabase:start`, `:stop`, `:reset`, `:status`, `:db:diff`, `:db:push` en `package.json`; doc breve en `docs/workflows/supabase-local.md` que explica el ciclo de dev (start → cambios → migration → reset → test → commit).
- **Archivos:** `package.json`, `supabase/config.toml`, `supabase/seed.sql` (vacío inicial), `.gitignore` (ignorar `supabase/.branches`, `supabase/.temp`), `docs/workflows/supabase-local.md`.
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** `conn-pooling` (leer para entender qué URL usa cada comando)
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** CLI instalado como devDep `supabase@2.95.5`. `supabase init` genera `config.toml` con project_id corregido a `ambulante` y pooler habilitado en transaction mode. Scripts agregados: `supabase:start/stop/reset/status/db:diff/db:push/test/test:rls`. `.gitignore` actualizado con `.branches` y `.temp`. Nota: el npm postinstall del CLI descarga el binario desde GitHub — si falla en CI sin internet, usar `pnpm install --ignore-scripts` y proveer el binario pre-descargado. Pre-existing TypeScript error en `HowItWorksClient.tsx:72` y lint error por `NEXT_PUBLIC_APP_URL` faltante — ambos existían en main antes de esta tarea.

### B0.2 — Env schema: URLs separadas (pooler vs directo) + secretos de backend
- **Estado:** ✅ done [owner: chat-2026-04-27, closed: 19:40]
- **Por qué:** Next.js serverless DEBE usar pooler mode transaction para no agotar conexiones; migraciones DEBEN usar conexión directa (el pooler no soporta prepared statements en transaction mode). Mezclarlas rompe producción.
- **Entregable:** Extensión del schema Zod existente (`shared/config/env.schema.ts`) con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `DATABASE_URL_POOLER`, `DATABASE_URL_DIRECT`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. `.env.example` actualizado con valores de Supabase local. Server-only vars marcadas explícitamente (no `NEXT_PUBLIC_*`).
- **Archivos:** `shared/config/env.schema.ts`, `shared/config/env.ts`, `shared/config/env.runtime.ts`, `.env.example`.
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** `conn-pooling`, `conn-prepared-statements`
- **REGISTRY:** `infra.md` (sección Config)
- **Estimación:** S
- **Notas:** Schema dividido en `clientEnvSchema` (NEXT_PUBLIC_* + NODE_ENV) y `serverOnlyEnvSchema`; merged en `serverEnvSchema`. Exports: `parseClientEnv`, `parseServerEnv`, `parseEnv` (alias). Tipos: `ClientEnv`, `ServerEnv`, `Env` (alias). Vars nuevas todas opcionales para backward compat (B0.1 pendiente). `DATABASE_URL_POOLER` y `DATABASE_URL_DIRECT` validadas con `new URL()` via refine (acepta scheme `postgresql://`). `CRON_SECRET` min 16 chars. `VAPID_SUBJECT` regex `^(mailto:|https://)`. `infra.md §9` actualizado. `.env.example` con defaults de Supabase local (puerto 54321/54322). 36/36 tests green. lint/typecheck failures son pre-existentes (pre-B0.2).

### B0.3 — Template de migraciones + convention doc
- **Estado:** ✅ done [owner: chat-2026-04-27, closed: 2026-04-27]
- **Por qué:** Postgres no soporta `ADD CONSTRAINT IF NOT EXISTS`. Migraciones que re-ejecutan (rollback parcial, reset local) fallan si no son idempotentes. Hay que enseñar el patrón desde el primer commit.
- **Entregable:** `supabase/migrations/_template.sql` con patrón `DO $$ BEGIN IF NOT EXISTS(...) THEN ... END $$;`; doc `docs/workflows/migration-guide.md` que cubre: naming (`YYYYMMDDhhmmss_snake_case.sql`), idempotencia de constraints, cómo rollback-ear, cómo manejar data migrations.
- **Archivos:** `supabase/migrations/_template.sql`, `docs/workflows/migration-guide.md`.
- **Depends on:** B0.1
- **Continues with:** —
- **Skill rules aplicables:** `schema-constraints`
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** Template cubre 9 patrones idempotentes: TABLE (IF NOT EXISTS), COLUMN (IF NOT EXISTS), CONSTRAINT UNIQUE/CHECK/FK (DO block + pg_constraint check), DROP CONSTRAINT (IF EXISTS nativo), INDEX (IF NOT EXISTS), ENUM/TYPE (EXCEPTION duplicate_object), FUNCTION (OR REPLACE), TRIGGER (pg_trigger check), POLICY (pg_policy check). Template nombrado `_template.sql` para que supabase db push lo ignore (sin timestamp prefix). Migration guide cubre: naming convention, tabla de DDL con soporte nativo vs. DO block, FK+índice en la misma migración, rollback strategy (nueva migración forward), data migrations (transacciones, NOT VALID pattern para tablas grandes), naming conventions de constraints/índices/triggers/policies, checklist pre-commit. Skill rule `schema-constraints` aplicada: todos los ADD CONSTRAINT usan DO block con pg_constraint.

### B0.4 — CI de migraciones + drift check + audit de FK sin índice
- **Estado:** ✅ done
- **Por qué:** Sin CI, una migración rota se descubre en prod. Drift check previene "alguien tocó la DB manualmente". Audit de FK sin índice previene el bug perf más común (skill rule HIGH).
- **Entregable:** Job nuevo en `.github/workflows/ci.yml` que: (a) levanta Supabase en el runner, (b) corre `supabase db push`, (c) corre `supabase db diff` y falla si hay drift, (d) corre una query contra `pg_constraint` / `pg_index` y falla si hay FK sin índice. El script de audit es un archivo SQL reusable.
- **Archivos:** `.github/workflows/ci.yml` (patch), `scripts/db-audit-fk-indexes.sql`.
- **Depends on:** B0.1, B0.3
- **Continues with:** —
- **Skill rules aplicables:** `schema-foreign-key-indexes`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** Job `db-migrations` agregado al workflow. Pasos: `supabase start` (levanta containers + aplica migraciones), `supabase db diff` (falla si hay drift — stdout vacío = OK), psql con `--tuples-only --no-align` contra `scripts/db-audit-fk-indexes.sql` (falla si devuelve filas). SQL script usa la query exacta de skill rule `schema-foreign-key-indexes`: JOIN `pg_constraint` + `pg_attribute` + NOT EXISTS en `pg_index`. Env var `SUPABASE_DB_URL` a nivel de job para evitar repetición. `postgresql-client` instalado en el step previo al audit. Skill rule `schema-foreign-key-indexes` (HIGH) aplicada.

---

# FASE B1 — Schema core + extensiones + índices + monitoring foundations

**Goal:** Plasmar el modelo del dominio en Postgres con los índices correctos desde el primer día. Dejar habilitadas las extensiones de monitoring que aceleran diagnóstico perf (antes que la app tenga tráfico).
**Acceptance criteria:** Todas las tablas del dominio existen con PKs bigint identity, FKs indexadas, snake_case lowercase, índices compuestos para queries conocidas e índices parciales para filtros estables; `pg_stat_statements`, `pg_cron`, `pg_net`, `postgis`, `pgcrypto`, `pgtap` habilitadas.

### B1.1 — Extensiones habilitadas
- **Estado:** ✅ done [owner: chat-2026-04-27]
- **Por qué:** Todas las fases posteriores dependen de estas extensiones. Habilitarlas en la primera migración garantiza orden y elimina re-trabajos.
- **Entregable:** migración `YYYYMMDDhhmmss_enable_extensions.sql` con `create extension if not exists` para: `postgis`, `pgcrypto`, `pg_stat_statements`, `pg_cron`, `pg_net`, `pgtap`. Configurar `pg_stat_statements.track = 'all'` en `supabase/config.toml`.
- **Archivos:** `supabase/migrations/<ts>_enable_extensions.sql`, `supabase/config.toml`.
- **Depends on:** B0.1, B0.3
- **Continues with:** B1.2 (cadena C-B1-schema)
- **Skill rules aplicables:** `monitor-pg-stat-statements`
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** `supabase/migrations/20260427000000_enable_extensions.sql` — 6 extensiones con `with schema extensions`. `config.toml` actualizado con `[db.settings] pg_stat_statements.track = "all"` antes de `[db.pooler]`.

### B1.2 — Tablas core del dominio
- **Estado:** ✅ done [owner: chat-2026-04-27]
- **Por qué:** Schema mínimo para que el resto de fases pueda construir. Lo pensamos integral para no refactorizar por agregados triviales.
- **Entregable:** migración `YYYYMMDDhhmmss_core_tables.sql` con tablas: `users` (extiende `auth.users` de Supabase via trigger), `stores`, `products`, `orders`, `order_items` (snapshot de producto), `store_locations` (append-only para tracking), `push_subscriptions`, `audit_log` (append-only inmutable). Convenciones: snake_case lowercase; PKs `bigint generated always as identity`; timestamps `created_at timestamptz not null default now()`; enum-ish via `check` constraints + tipos de dominio (`order_status`, `user_role`); `order_items.product_snapshot` como JSONB tipado. `id` externo para clientes via columna `public_id uuid` con `default gen_random_uuid()` en las tablas expuestas (orders, stores, products).
- **Archivos:** `supabase/migrations/<ts>_core_tables.sql`, `supabase/migrations/<ts>_auth_users_sync_trigger.sql`.
- **Depends on:** B1.1
- **Continues with:** B1.3 (cadena C-B1-schema)
- **Skill rules aplicables:** `schema-primary-keys`, `schema-data-types`, `schema-lowercase-identifiers`, `schema-constraints`, `schema-foreign-key-indexes`
- **REGISTRY:** `domain.md` (nueva sección: Tablas SQL del dominio, con snippet de cada tabla).
- **Estimación:** L
- **Notas:** `20260427000001_core_tables.sql` — 8 tablas, 2 enum types (user_role, order_status), 9 FK constraints via DO/pg_constraint blocks + covering indexes, `set_updated_at()` trigger on 5 mutable tables, `sync_store_current_location()` AFTER INSERT trigger on store_locations that denormalizes `stores.current_location`. `20260427000002_auth_users_sync_trigger.sql` — `handle_new_auth_user()` SECURITY DEFINER + trigger on `auth.users`. Notable design: `audit_log.actor_id` is a soft reference (no FK) so audit rows survive user deletion; `order_items.product_id` is nullable FK with ON DELETE SET NULL (product_snapshot is source of truth).

### B1.3 — Índices compuestos para queries conocidas
- **Estado:** ✅ done [owner: chat-2026-04-27]
- **Por qué:** Las queries críticas (mapa de tiendas activas, inbox de pedidos, historial de cliente) son predecibles desde el PRD. Agregar índices compuestos ahora es barato; agregarlos cuando hay data es doloroso.
- **Entregable:** migración `YYYYMMDDhhmmss_composite_indexes.sql` con índices compuestos: `(status, created_at)` en orders (para inbox tienda); `(store_id, status, created_at)` en orders (para historial por tienda); `(customer_id, created_at desc)` en orders (para historial cliente); `(store_id, available)` en products; GIST en `store_locations(location)` para queries PostGIS de radio. Cada índice justificado en comentario SQL con la query que lo usa.
- **Archivos:** `supabase/migrations/<ts>_composite_indexes.sql`.
- **Depends on:** B1.2
- **Continues with:** B1.4 (cadena C-B1-schema)
- **Skill rules aplicables:** `query-composite-indexes`, `query-index-types`, `query-missing-indexes`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** `20260427000003_composite_indexes.sql` — 4 indexes: `orders(store_id, status, created_at desc)`, `orders(customer_id, created_at desc)`, `products(store_id, available)`, `store_locations(location) USING gist`.

### B1.4 — Índices parciales para filtros estables
- **Estado:** ✅ done [owner: chat-2026-04-27]
- **Por qué:** Queries que filtran siempre por el mismo predicado (ej: `stores where available = true`, `orders where status in ('ENVIADO','RECIBIDO')`) se benefician de índices parciales — 5-20x más chicos, updates más baratos.
- **Entregable:** migración `YYYYMMDDhhmmss_partial_indexes.sql` con: índice parcial de `stores.location` donde `available = true`; índice parcial de `orders.created_at` donde `status in ('ENVIADO','RECIBIDO')`; índice parcial de `products.sku` donde `sku is not null`. Cada uno comentado.
- **Archivos:** `supabase/migrations/<ts>_partial_indexes.sql`.
- **Depends on:** B1.3
- **Continues with:** B1.5 (cadena C-B1-schema)
- **Skill rules aplicables:** `query-partial-indexes`
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** `20260427000004_partial_indexes.sql` — 3 partial indexes: `stores(current_location) USING gist WHERE available = true`, `orders(created_at desc) WHERE status IN ('enviado','recibido')`, `products(sku) WHERE sku IS NOT NULL`.

### B1.5 — Audit de FK sin índice + test CI
- **Estado:** ✅ done [owner: chat-2026-04-27]
- **Por qué:** Cerrar la cadena con un test que garantice que ninguna FK futura queda sin índice. Si la regla se escribe solo en docs, se rompe.
- **Entregable:** SQL script `scripts/db-audit-fk-indexes.sql` integrado al job de CI de B0.4 — si la query devuelve filas, el CI falla. Reporta tabla + columna sin índice.
- **Archivos:** `scripts/db-audit-fk-indexes.sql`, `.github/workflows/ci.yml` (patch).
- **Depends on:** B1.4
- **Continues with:** —
- **Skill rules aplicables:** `schema-foreign-key-indexes`
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** Pre-implementado en B0.4 — `scripts/db-audit-fk-indexes.sql` y el job CI ya existían al comienzo de la cadena B1. El audit corre automáticamente en cada push y falla si cualquier FK carece de índice. Todos los índices de FK de B1.2 satisfacen el check.

---

# FASE B2 — RLS policies + pgTAP tests + performance RLS

**Goal:** Activar Row Level Security en todas las tablas del dominio, con tests automatizados que garantizan tanto la corrección como la performance.
**Acceptance criteria:** Cada tabla tiene `enable row level security` + `force row level security` + policies por rol (anon, authenticated, service_role); suite pgTAP cubre casos positivos/negativos por rol; benchmark RLS valida <20ms para queries críticas con 10k stores / 100k orders.

### B2.1 — Policies RLS de todas las tablas del dominio
- **Estado:** ✅ done [owner: chat-2026-04-28, closed: 2026-04-28]
- **Por qué:** El invariante PRD §7.2 (privacidad de ubicación) y §7.3 (roles aislados) es trabajo de RLS, no de código de aplicación. Es el activo de seguridad más crítico del sistema.
- **Entregable:** migración `YYYYMMDDhhmmss_rls_policies.sql` con policies completas para: `users`, `stores`, `products`, `orders`, `order_items`, `store_locations`, `push_subscriptions`, `audit_log`. **Todas usan `(select auth.uid())`** — nunca `auth.uid()` directo. Cobertura: cliente puede leer tiendas disponibles y sus propios pedidos; tienda puede CRUD solo su catálogo y leer/transicionar sus pedidos; admin lee todo via security definer functions; audit_log es append-only para todos (no UPDATE, no DELETE).
- **Archivos:** `supabase/migrations/<ts>_rls_policies.sql`.
- **Depends on:** B1.2
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-basics`, `security-rls-performance`, `security-privileges`
- **REGISTRY:** `domain.md` (sección: RLS — resumen por tabla y rol).
- **Estimación:** L
- **Notas:** Entregado en `supabase/migrations/20260428000000_rls_policies.sql`. 8 tablas con ENABLE + FORCE RLS. 19 policies consolidadas (1 SELECT por tabla/rol para evitar advisory 0006). 3 helpers security definer: `current_user_id()`, `current_store_id()`, `is_admin()`. PRD §7.2 customer_location privacidad delegada a B2.2 view (la RLS da visibilidad de fila; la view controla la columna). Dos bugs pre-existentes corregidos en B0 migrations para desbloquear supabase start: `[db.settings]` inválido en config.toml y grant de pg_cron schema condicional.

### B2.2 — Helper functions security definer para cross-tenant checks
- **Estado:** 🟢 ready
- **Por qué:** Policies que validan pertenencia a equipos/roles (ej: "admin puede ver todo") deben usar funciones `security definer` para evitar recursión RLS y mantener performance (skill rule HIGH).
- **Entregable:** migración con funciones: `is_admin()`, `is_store_owner(store_id bigint)`, `owns_order(order_id bigint)`, `has_role(role user_role)`. Todas `language sql security definer set search_path = ''`. Cada una con index-backed lookup.
- **Archivos:** `supabase/migrations/<ts>_rls_helpers.sql`.
- **Depends on:** B2.1
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-performance`, `security-privileges`
- **REGISTRY:** `domain.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B2.3 — pgTAP test suite para policies
- **Estado:** ⚪ pending
- **Por qué:** Una policy mal escrita no falla: simplemente expone data. Sin tests, el bug es invisible hasta que alguien lo explota. pgTAP corre SQL tests con asserts.
- **Entregable:** `supabase/tests/rls_users.sql`, `rls_stores.sql`, `rls_products.sql`, `rls_orders.sql`, `rls_audit_log.sql` con mínimo: (a) positivos (el rol autorizado ve/escribe lo suyo); (b) negativos (otro rol no ve / no escribe); (c) edge case de privacy de ubicación (cliente antes de ACEPTADO no expone su location a la tienda). Script `pnpm supabase:test:rls` que corre todos. Integrado al CI.
- **Archivos:** `supabase/tests/*.sql`, `package.json` (script), `.github/workflows/ci.yml` (patch).
- **Depends on:** B2.2
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-basics`
- **REGISTRY:** `testing.md` (sección: pgTAP RLS tests).
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B2.4 — Benchmark de performance RLS
- **Estado:** ⚪ pending
- **Por qué:** RLS mal optimizado puede volver queries 10-100x más lentas. Necesitamos un número duro que falle el CI si alguien regresa la performance.
- **Entregable:** Script `scripts/rls-benchmark.sql` que: (a) genera data sintética (10k stores, 100k orders, 1k users); (b) corre las 5 queries más críticas del dominio con `EXPLAIN ANALYZE`; (c) asserta que `mean_exec_time < 20ms` por query. Integrado al CI como job paralelo (no bloqueante inicialmente, bloqueante después de primera baseline).
- **Archivos:** `scripts/rls-benchmark.sql`, `.github/workflows/ci.yml` (patch).
- **Depends on:** B2.3
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-performance`, `monitor-explain-analyze`
- **REGISTRY:** `testing.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B2.5 — Lint SQL check de patrones RLS prohibidos
- **Estado:** ⚪ pending
- **Por qué:** La regla "usar `(select auth.uid())` nunca `auth.uid()`" es fácil de olvidar. Un grep en CI la vuelve estructural.
- **Entregable:** Script `scripts/rls-lint.sh` que: (a) busca `auth.uid()` no envuelto en subquery; (b) busca policies sin `to authenticated`/`to anon` explícito; (c) falla el CI si encuentra. Documentado en `docs/workflows/rls-patterns.md`.
- **Archivos:** `scripts/rls-lint.sh`, `docs/workflows/rls-patterns.md`, `.github/workflows/ci.yml` (patch).
- **Depends on:** B2.1
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-performance`
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

---

# FASE B3 — Boundaries de portabilidad (Repository + Facades + lint rule)

**Goal:** Instalar la disciplina arquitectónica que permite swap de backend sin tocar features. Definir **dónde** vive Supabase y blindarlo con lint rules.
**Acceptance criteria:** Toda interface de F3.4 tiene su implementación Supabase; los 4 facades (Auth, Storage, Realtime, Push) tienen firma documentada y stub apuntando a Supabase; ESLint bloquea imports de `@supabase/*` fuera de los 3 directorios permitidos; CI corre el check de imports y falla si hay violaciones.

### B3.1 — Repositories Supabase (implementaciones de F3.4)
- **Estado:** ⚪ pending
- **Por qué:** Sin repositories, los hooks de React Query van a consumir Supabase directo y pierde portabilidad. Este es el cuello de botella del patrón (c').
- **Entregable:** `shared/repositories/supabase/` con archivos: `users.supabase.ts`, `stores.supabase.ts`, `products.supabase.ts`, `orders.supabase.ts`, `audit-log.supabase.ts`, `push-subscriptions.supabase.ts`. Cada uno implementa la interface correspondiente de F3.4 y usa `@supabase/ssr` con el cliente correcto (browser client para reads públicos, service role en Server Actions). Cada repository expone embeddings para evitar N+1 (ej: `storesNearby.findAll` retorna stores + sus productos en una query).
- **Archivos:** `shared/repositories/index.ts` (factory), `shared/repositories/supabase/*.ts` (6 archivos).
- **Depends on:** B1.2, B2.1
- **Continues with:** —
- **Skill rules aplicables:** `data-n-plus-one`, `data-pagination`, `data-batch-inserts`
- **REGISTRY:** `data.md` (nueva sección: Repositories).
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B3.2 — Facades Auth + Storage + Realtime + Push (stubs Supabase)
- **Estado:** ⚪ pending
- **Por qué:** Los 4 facades ya existen como mocks (F4, F5, F6, F8 del frontend epic). Esta tarea instala la implementación Supabase con el mismo contrato, sin wirear todavía a Supabase real (eso se hace en B4-B8). El objetivo: las firmas están estables y los features pueden seguir importando el facade.
- **Entregable:** `shared/services/auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`, `push.supabase.ts` con stubs que: (a) importan el SDK; (b) implementan la firma; (c) marcan cuerpo como `TODO — implementar en B4/B5/B6/B8`. Factory en `shared/services/index.ts` que exporta el facade correcto según env (`MOCK_BACKEND=true` → mock, false → supabase).
- **Archivos:** `shared/services/auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`, `push.supabase.ts`, `shared/services/index.ts` (factory).
- **Depends on:** B0.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md` (sección: Facades y factory).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B3.3 — ESLint `no-restricted-imports` para `@supabase/*`
- **Estado:** ⚪ pending
- **Por qué:** Sin esta regla, cualquier dev apurado importa el SDK desde un feature y rompe la portabilidad silenciosamente.
- **Entregable:** Regla en `.eslintrc.json` que prohíbe `@supabase/ssr` y `@supabase/supabase-js` excepto en los 3 directorios permitidos (via `overrides`). Error, no warning.
- **Archivos:** `.eslintrc.json`.
- **Depends on:** B3.1, B3.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B3.4 — CI check: no hay imports rotos
- **Estado:** ⚪ pending
- **Por qué:** La regla ESLint de B3.3 funciona en dev, pero se puede bypasear con `eslint-disable`. Un check independiente en CI cierra el bucle.
- **Entregable:** Script `scripts/check-supabase-imports.sh` que hace `grep -r "@supabase" features/ app/ (excluyendo app/api/cron/)` y falla con exit 1 si encuentra algo. Integrado al CI como step.
- **Archivos:** `scripts/check-supabase-imports.sh`, `.github/workflows/ci.yml` (patch).
- **Depends on:** B3.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

---

# FASE B4 — Auth real (Supabase Auth + Google + magic link + middleware)

**Goal:** Reemplazar el mock de auth por Supabase Auth completo, con providers email/password + magic link + Google, session handling via `@supabase/ssr`, y middleware que protege rutas por rol.
**Acceptance criteria:** Usuario puede registrarse, confirmar email, loguear con password o magic link o Google; middleware redirige según rol; el facade `AuthService` apunta a la implementación real y los features no notan el cambio.

### B4.1 — Configurar providers en supabase/config.toml
- **Estado:** ⚪ pending
- **Por qué:** Los providers (email, magic link, Google OAuth) se configuran declarativamente en Supabase. Commit en el repo = reproducible en cualquier instancia.
- **Entregable:** `supabase/config.toml` con `[auth]` + `[auth.email]` (confirm_email = true, template_magic_link customizado ES) + `[auth.external.google]` (client_id + secret via env). Doc breve en `docs/workflows/auth-setup.md` con los pasos para crear la Google OAuth app y pegar los secrets en prod.
- **Archivos:** `supabase/config.toml`, `docs/workflows/auth-setup.md`.
- **Depends on:** B0.1
- **Continues with:** B4.2 (cadena C-B4-auth)
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B4.2 — `@supabase/ssr` wiring + middleware.ts swap
- **Estado:** ⚪ pending
- **Por qué:** El `middleware.ts` actual está stubbeado. Supabase Auth necesita cookie-based session handling server-side para funcionar en App Router.
- **Entregable:** `shared/repositories/supabase/client.ts` con `createBrowserClient`, `createServerClient`, `createRouteHandlerClient`; `middleware.ts` actualizado que refresca sesión + extrae user + determina rol desde `users` + redirige según route group `(client)/(store)/(admin)`.
- **Archivos:** `shared/repositories/supabase/client.ts`, `middleware.ts`, `middleware.test.ts`.
- **Depends on:** B4.1, B3.2
- **Continues with:** B4.3 (cadena C-B4-auth)
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md` (sección Clientes Supabase), `infra.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B4.3 — Implementación completa del facade `AuthService`
- **Estado:** ⚪ pending
- **Por qué:** Con el SSR wiring listo, hay que llenar los stubs de B3.2 con implementaciones reales que llamen a `supabase.auth.signInWith*`.
- **Entregable:** `shared/services/auth.supabase.ts` con firmas completas: `signIn`, `signInWithMagicLink`, `signInWithGoogle`, `signOut`, `getSession`, `getUser`, `onAuthStateChange`. Tests unitarios para cada método (mockeando el cliente). Actualizar `shared/services/index.ts` factory para usar auth.supabase.ts por default cuando `MOCK_BACKEND=false`.
- **Archivos:** `shared/services/auth.supabase.ts`, `shared/services/auth.supabase.test.ts`, `shared/services/index.ts`.
- **Depends on:** B4.2
- **Continues with:** B4.4 (cadena C-B4-auth)
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B4.4 — Callbacks OAuth + confirm email + error pages
- **Estado:** ⚪ pending
- **Por qué:** Los flows de OAuth terminan en `/auth/callback`; el confirm email en `/auth/confirm`. Sin estos endpoints, la UI rompe al volver de Google / click en magic link.
- **Entregable:** Route Handlers `app/auth/callback/route.ts` (intercambia code por session) y `app/auth/confirm/route.ts` (confirma email via token_hash). Páginas de error `app/auth/error/page.tsx` con UX en español para los casos "link expirado", "email ya confirmado", "login fallido". Tests E2E en `e2e/auth.spec.ts` del flow completo magic link + password.
- **Archivos:** `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`, `app/auth/error/page.tsx`, `e2e/auth.spec.ts`.
- **Depends on:** B4.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** L
- **Notas:** (se llena al cerrar)

---

# FASE B5 — Storage (buckets + RLS + upload helpers)

**Goal:** Dejar los 3 buckets del producto operativos con RLS correctamente configurada y helpers reutilizables para upload con validación.
**Acceptance criteria:** Buckets `products`, `store-logos`, `validation-docs` existen con policies; el facade `StorageService` apunta a Supabase; upload helper valida tamaño, mime type, y orienta al user si algo falla; tests de integración cubren los 3 buckets.

### B5.1 — Crear buckets + RLS de Storage
- **Estado:** ⚪ pending
- **Por qué:** Cada bucket tiene reglas de acceso distintas (productos es público de lectura; validation-docs es admin-only). Policies mal puestas = leak de documentos de identidad.
- **Entregable:** migración `YYYYMMDDhhmmss_storage_buckets.sql` que crea los 3 buckets con `storage.buckets` + policies via `storage.objects`. Bucket `products` (público read, tienda puede escribir solo en su path `store-<id>/`); `store-logos` (público read, tienda escribe solo en su path); `validation-docs` (private, tienda escribe, admin lee). Límites de tamaño: 5MB productos/logos, 10MB docs.
- **Archivos:** `supabase/migrations/<ts>_storage_buckets.sql`.
- **Depends on:** B2.2
- **Continues with:** —
- **Skill rules aplicables:** `security-rls-basics`, `security-privileges`
- **REGISTRY:** `domain.md` (sección: Storage buckets y RLS).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B5.2 — Implementación del facade `StorageService`
- **Estado:** ⚪ pending
- **Por qué:** Los componentes de upload (ya existentes en features/catalog y features/store-profile) consumen `StorageService`. Necesitamos la implementación real.
- **Entregable:** `shared/services/storage.supabase.ts` con `upload`, `getPublicUrl`, `getSignedUrl`, `remove`. Validación de tamaño + mime type integrada. Conversión de errores Supabase a errores de dominio (`StorageError`).
- **Archivos:** `shared/services/storage.supabase.ts`, `shared/services/storage.supabase.test.ts`.
- **Depends on:** B5.1, B3.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B5.3 — Upload helper con optimización de imagen
- **Estado:** ⚪ pending
- **Por qué:** Subir fotos directas desde móvil llega con 3-8MB frecuentemente. Resize client-side antes de upload ahorra ancho de banda y storage. Es un detalle de UX/perf que paga rápido.
- **Entregable:** `shared/utils/image-upload.ts` con `resizeImageForUpload(file, maxDim=1600)` usando `createImageBitmap` + canvas. Tests con fixtures. Integración en `features/catalog/components/ProductImageUpload`.
- **Archivos:** `shared/utils/image-upload.ts`, `shared/utils/image-upload.test.ts`.
- **Depends on:** B5.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `infra.md` (sección Utils).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B5.4 — Flow admin: revisar documentos de validación
- **Estado:** ⚪ pending
- **Por qué:** El bucket `validation-docs` existe, pero sin una UI admin para revisarlos no se aprovecha. Esta tarea cierra el loop con `features/store-validation/`.
- **Entregable:** Hook `useValidationDoc(storeId, docType)` que genera signed URL + componente `<ValidationDocViewer>` en `features/store-validation/`. Integración con `features/admin-store-validation` para mostrar docs al revisar una tienda pendiente.
- **Archivos:** `features/store-validation/hooks/useValidationDoc.ts`, `features/store-validation/components/ValidationDocViewer/`.
- **Depends on:** B5.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

# FASE B6 — Realtime wiring

**Goal:** Dejar operativo Supabase Realtime para propagación <5s de cambios de estado de pedido y de disponibilidad de tiendas (PRD §7.2 invariante).
**Acceptance criteria:** `RealtimeService` apunta a Supabase Realtime; suscripciones por canal funcionan; React Query invalida cache correctamente al recibir eventos; reconnect + backoff en caso de desconexión; test E2E verifica propagación <5s.

### B6.1 — Habilitar Realtime + publicar tablas necesarias
- **Estado:** ⚪ pending
- **Por qué:** Realtime en Supabase no escucha todas las tablas por default — hay que publicarlas explícitamente vía `alter publication supabase_realtime add table ...`. Sin esto, las subscriptions no disparan.
- **Entregable:** migración `YYYYMMDDhhmmss_realtime_publication.sql` que agrega a la publication: `orders`, `store_locations`, `stores` (columna `available`). Supabase aplica esto globalmente.
- **Archivos:** `supabase/migrations/<ts>_realtime_publication.sql`.
- **Depends on:** B1.2, B2.1
- **Continues with:** B6.2 (cadena C-B6-realtime)
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B6.2 — Implementación del facade `RealtimeService`
- **Estado:** ⚪ pending
- **Por qué:** La firma de F5.2 (ya existente como mock) define `subscribe(channel, handler)`. Hay que llenarla con Supabase Realtime respetando el contrato.
- **Entregable:** `shared/services/realtime.supabase.ts` con `subscribe`, `unsubscribe`, `broadcast`. Manejo de canales `orders:id`, `stores:available`, `store-locations:store_id`. Tests con mock del cliente Supabase.
- **Archivos:** `shared/services/realtime.supabase.ts`, `shared/services/realtime.supabase.test.ts`.
- **Depends on:** B6.1, B3.2
- **Continues with:** B6.3 (cadena C-B6-realtime)
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B6.3 — Integración Realtime ↔ React Query
- **Estado:** ⚪ pending
- **Por qué:** Cuando llega un evento realtime, hay que actualizar el cache de React Query (o invalidarlo). Sin esto, la UI no refleja el cambio aunque el evento haya llegado.
- **Entregable:** Hook `useRealtimeInvalidation(channel, queryKeys)` en `shared/hooks/`. Usos concretos: `useOrderRealtime(orderId)`, `useStoresAvailabilityRealtime()`. Tests unitarios del hook + test E2E de un flow (tienda cambia disponibilidad → cliente ve el cambio <2s).
- **Archivos:** `shared/hooks/useRealtimeInvalidation.ts`, `features/orders/hooks/useOrderRealtime.ts`, `features/map/hooks/useStoresAvailabilityRealtime.ts`.
- **Depends on:** B6.2
- **Continues with:** B6.4 (cadena C-B6-realtime)
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md` (sección Realtime hooks).
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B6.4 — Reconnect + backoff + test <5s
- **Estado:** ⚪ pending
- **Por qué:** Desconexiones son comunes en móvil. Sin reconnect automático, el cliente queda mudo tras un túnel.
- **Entregable:** Lógica de reconnect con exponential backoff en `realtime.supabase.ts`. Test E2E `e2e/realtime-propagation.spec.ts` que: (a) crea un pedido; (b) tienda lo acepta; (c) cliente ve el cambio en <5s. Configurado en CI.
- **Archivos:** `shared/services/realtime.supabase.ts` (patch), `e2e/realtime-propagation.spec.ts`.
- **Depends on:** B6.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `testing.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

# FASE B7 — Cron & system jobs (pg_cron + pg_net + state machine)

**Goal:** Dejar los timeouts del PRD §7.6 automatizados — `EXPIRADO` a 10min sin respuesta, auto-close a 2h de ACEPTADO — usando pg_cron que dispara Route Handlers Next.js con la state machine TS.
**Acceptance criteria:** pg_cron tiene 2 schedules activos; los Route Handlers usan `SKIP LOCKED` para soportar workers concurrentes; tests de integración verifican correctness bajo concurrencia.

### B7.1 — Migración schedule_crons + helper pg_net
- **Estado:** ⚪ pending
- **Por qué:** Sin el schedule registrado en `cron.schedule(...)`, nada corre. El helper pg_net envuelve `net.http_post(...)` con el header de autorización.
- **Entregable:** migración `YYYYMMDDhhmmss_schedule_crons.sql` que: (a) crea función `call_cron_endpoint(path text)` que lee `CRON_SECRET` de `app_settings` y hace POST firmado; (b) registra 2 schedules: `expire-orders` cada 1 min, `auto-close-orders` cada 10 min. Secret se inyecta a Supabase desde env en B14 (prod) o desde `supabase/config.toml [edge_runtime.secrets]` (local).
- **Archivos:** `supabase/migrations/<ts>_schedule_crons.sql`.
- **Depends on:** B1.1 (pg_cron + pg_net habilitados), B0.2 (CRON_SECRET en env)
- **Continues with:** B7.2 (cadena C-B7-cron)
- **Skill rules aplicables:** —
- **REGISTRY:** `domain.md` (sección: Scheduled jobs).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B7.2 — Route Handler `/api/cron/expire-orders` con SKIP LOCKED
- **Estado:** ⚪ pending
- **Por qué:** PRD §7.6: pedidos sin respuesta → `EXPIRADO` a los 10min. Debe ser idempotente (puede dispararse 2x por lag) y seguro bajo concurrencia.
- **Entregable:** `app/api/cron/expire-orders/route.ts` que: (a) valida `Authorization: Bearer ${CRON_SECRET}`; (b) hace UPDATE atómico con `SKIP LOCKED` para claim y transition en un solo statement; (c) usa la state machine TS (F3.2) para validar cada transición; (d) emite domain events post-commit (F3.5); (e) retorna JSON con count de orders transitioned. Tests unitarios + tests de integración con 100 orders concurrent.
- **Archivos:** `app/api/cron/expire-orders/route.ts`, `app/api/cron/expire-orders/route.test.ts`.
- **Depends on:** B7.1, B3.1
- **Continues with:** B7.3 (cadena C-B7-cron)
- **Skill rules aplicables:** `lock-skip-locked`, `lock-short-transactions`
- **REGISTRY:** —
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B7.3 — Route Handler `/api/cron/auto-close-orders`
- **Estado:** ⚪ pending
- **Por qué:** PRD §7.6: pedidos `ACEPTADO` sin cierre → auto-close a 2h. Mismo patrón que B7.2.
- **Entregable:** `app/api/cron/auto-close-orders/route.ts` con igual patrón `SKIP LOCKED` + state machine + events. Diferencia: ventana de 2h, target status `FINALIZADO` (auto-close implícito) según decisión del PRD §9.2 ("auto-cierre tras ventana").
- **Archivos:** `app/api/cron/auto-close-orders/route.ts`, tests.
- **Depends on:** B7.2
- **Continues with:** —
- **Skill rules aplicables:** `lock-skip-locked`, `lock-short-transactions`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B7.4 — Runbook: cómo desactivar / reactivar / auditar un cron
- **Estado:** ⚪ pending
- **Por qué:** En un incidente, alguien va a necesitar apagar un cron en caliente sin un deploy. Sin runbook, el pánico multiplica el error.
- **Entregable:** `docs/runbooks/cron-management.md` con: (a) cómo apagar un schedule (`select cron.unschedule('expire-orders')`); (b) cómo volver a activarlo; (c) cómo ver ejecuciones recientes (`select * from cron.job_run_details order by start_time desc limit 20`); (d) cómo ver errores; (e) cómo reprocesar una ventana perdida.
- **Archivos:** `docs/runbooks/cron-management.md`.
- **Depends on:** B7.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B7.5 — Tests de integración concurrentes
- **Estado:** ⚪ pending
- **Por qué:** `SKIP LOCKED` es fácil de romper si se hace un refactor. Tests concurrentes detectan regresiones antes de producción.
- **Entregable:** `app/api/cron/expire-orders/route.concurrent.test.ts` que lanza 5 workers paralelos contra la misma ventana y verifica: (a) cada order se procesa exactamente una vez; (b) no hay deadlocks; (c) throughput > N órdenes / segundo. Mismo test para auto-close.
- **Archivos:** `app/api/cron/*/route.concurrent.test.ts`.
- **Depends on:** B7.2, B7.3
- **Continues with:** —
- **Skill rules aplicables:** `lock-skip-locked`, `lock-deadlock-prevention`
- **REGISTRY:** `testing.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

# FASE B8 — Web Push delivery (VAPID + subscriptions + triggers)

**Goal:** Completar el loop de notificaciones push: el browser se suscribe → guardamos la subscription → cuando cambia estado del pedido, disparamos push al subscriber correspondiente.
**Acceptance criteria:** Tabla `push_subscriptions` con RLS correcta; endpoint de suscripción funciona end-to-end; domain event `OrderStatusChanged` dispara push; retry + cleanup de subscriptions muertas (410 Gone).

### B8.1 — VAPID keys + tabla + endpoint de subscribe
- **Estado:** ⚪ pending
- **Por qué:** VAPID es el estándar para identificar al servidor ante el push service del browser. Sin VAPID, el browser rechaza.
- **Entregable:** (a) Generar VAPID keys con `npx web-push generate-vapid-keys` y guardarlas en env vars (ya agregadas en B0.2); (b) Endpoint `app/api/push/subscribe/route.ts` (POST) que recibe subscription JSON del browser y la guarda en `push_subscriptions` con el `user_id` del JWT; (c) Endpoint `app/api/push/unsubscribe/route.ts` (DELETE).
- **Archivos:** `app/api/push/subscribe/route.ts`, `app/api/push/unsubscribe/route.ts`.
- **Depends on:** B1.2 (tabla push_subscriptions existe), B2.1 (RLS de push_subscriptions: cada user ve solo las suyas)
- **Continues with:** B8.2 (cadena C-B8-push)
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B8.2 — Domain event listener: OrderStatusChanged → webpush
- **Estado:** ⚪ pending
- **Por qué:** La decisión arquitectónica fue "efectos secundarios post-commit via domain events" (regla transversal 5). Un listener suscrito al event `OrderStatusChanged` dispara `webpush.sendNotification()` a las subscriptions del user target.
- **Entregable:** `shared/services/push.supabase.ts` implementado completo con `sendToUser(userId, payload)` usando la lib `web-push`. Listener registrado en `shared/domain/events/index.ts` que al recibir `OrderStatusChanged` lee las subscriptions del destinatario (cliente si es transición tienda→cliente, tienda si es transición cliente→tienda) y manda push.
- **Archivos:** `shared/services/push.supabase.ts`, `shared/domain/events/listeners/push-on-status-change.ts`.
- **Depends on:** B8.1, B3.2
- **Continues with:** B8.3 (cadena C-B8-push)
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md` (sección Push), `domain.md` (sección Event listeners).
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B8.3 — Retry + dead subscription cleanup
- **Estado:** ⚪ pending
- **Por qué:** Push endpoints expiran (cambio de dispositivo, revocación). El web push service responde 410 Gone — hay que borrar la subscription para no reintentar por siempre.
- **Entregable:** En `push.supabase.ts`, wrap de `webpush.sendNotification` con retry (3 intentos, backoff exponencial). Si response es 410 o 404 → DELETE de la subscription. Logs estructurados a Sentry.
- **Archivos:** `shared/services/push.supabase.ts` (patch), tests.
- **Depends on:** B8.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B8.4 — Test E2E del loop completo
- **Estado:** ⚪ pending
- **Por qué:** Validar que el browser realmente recibe el push no es trivial en tests unitarios. Un test E2E con Playwright + stub de service worker confirma el loop.
- **Entregable:** `e2e/push-delivery.spec.ts` que: (a) loguea un cliente; (b) suscribe al push; (c) hace submit de un pedido; (d) en otra browser context, loguea como tienda; (e) acepta el pedido; (f) verifica que el cliente recibió el push (via mock del push service captureado por Playwright).
- **Archivos:** `e2e/push-delivery.spec.ts`.
- **Depends on:** B8.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `testing.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

---

# FASE B9 — Swap cliente (features Cliente consumen backend real)

**Goal:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
**Acceptance criteria:** Cliente puede registrarse, ver mapa con tiendas reales, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

### B9.1 — Swap auth en features/auth + landing
- **Estado:** ⚪ pending
- **Por qué:** Primer swap: login/register/magic-link. Habilita todo lo demás.
- **Entregable:** features/landing y features/auth importan `AuthService` real. Tests unitarios y E2E actualizados.
- **Archivos:** `features/landing/**`, `features/auth/**` (si existe) o las páginas `app/(auth)/*`.
- **Depends on:** B4.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B9.2 — Swap stores nearby + feed del mapa
- **Estado:** ⚪ pending
- **Por qué:** El feature core del cliente. Sin tiendas reales visibles en el mapa, nada funciona.
- **Entregable:** `features/map/services/stores.mock.ts` reemplazado por uso de `StoresRepository.findNearby(lat, lng, radiusMeters)` que usa PostGIS `st_dwithin`. Query optimizada con embeddings para traer productos en la misma call (evita N+1).
- **Archivos:** `features/map/hooks/**`, `features/map/services/**`.
- **Depends on:** B3.1, B6.3
- **Continues with:** —
- **Skill rules aplicables:** `data-n-plus-one`, `query-index-types`
- **REGISTRY:** `features.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B9.3 — Swap store detail + products
- **Estado:** ⚪ pending
- **Por qué:** Segunda pantalla del flow cliente — abrir una tienda y ver productos.
- **Entregable:** `features/store-detail/` (o equivalente) consume `StoresRepository.findByPublicId` + `ProductsRepository.findByStore`. Incluye fotos via storage facade.
- **Archivos:** `features/store-detail/**`.
- **Depends on:** B3.1, B5.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B9.4 — Swap cart + submit order (con snapshot + transacción corta)
- **Estado:** ⚪ pending
- **Por qué:** La transición más crítica. Server Action que crea order + order_items (con snapshot de productos) en una transacción corta; emite `OrderCreated` post-commit.
- **Entregable:** Server Action `submitOrder(input)` en `features/order-flow/actions.ts`. Validación Zod, state machine check, transacción atómica, event emit. Tests unitarios + E2E.
- **Archivos:** `features/order-flow/actions.ts`, `features/order-flow/actions.test.ts`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `lock-short-transactions`, `data-batch-inserts`
- **REGISTRY:** `features.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B9.5 — Swap order tracking + realtime subscription
- **Estado:** ⚪ pending
- **Por qué:** Cliente ve estado actual de su pedido con actualización en vivo.
- **Entregable:** `features/orders/components/OrderTracking/` consume `OrdersRepository.findByPublicId` + `useOrderRealtime(orderId)`. UI con estados traducidos (ES).
- **Archivos:** `features/orders/**` del lado cliente.
- **Depends on:** B6.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B9.6 — Swap order history
- **Estado:** ⚪ pending
- **Por qué:** Requisito C7 del PRD — historial de pedidos previos con estado final.
- **Entregable:** Query paginada `OrdersRepository.findByCustomer(customerId, cursor)` con keyset pagination. Hook + componente + tests.
- **Archivos:** `features/orders/hooks/useOrderHistory.ts`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `data-pagination`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B9.7 — Swap cancel flow
- **Estado:** ⚪ pending
- **Por qué:** Cliente puede cancelar pre-ACEPTADO (PRD §6.1). Server Action con state machine check.
- **Entregable:** Server Action `cancelOrder(orderId, reason?)` con validación de rol + state machine. Emite `OrderCancelled`.
- **Archivos:** `features/orders/actions.ts`.
- **Depends on:** B9.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B9.8 — Swap push subscribe del cliente + profile
- **Estado:** ⚪ pending
- **Por qué:** Cliente opta por recibir notificaciones desde su perfil. Sin este wire, las notifs de B8 no llegan a nadie.
- **Entregable:** Flow de opt-in en `features/profile/`: botón "Activar notificaciones" → solicita permiso → se suscribe via `PushService.subscribeUser`. Avatar / preferencias básicas del user.
- **Archivos:** `features/profile/**`.
- **Depends on:** B8.1
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

# FASE B10 — Swap tienda (features Tienda consumen backend real)

**Goal:** Mismo objetivo que B9 pero del lado Tienda. Todos los mocks de dashboard, catálogo, availability, inbox, accept/reject/finalize quedan reemplazados.
**Acceptance criteria:** Tienda puede loguear, activar disponibilidad, publicar ubicación, crear/editar productos, ver pedidos entrantes en vivo, aceptar/rechazar/finalizar, gestionar perfil.

### B10.1 — Swap auth + onboarding tienda
- **Estado:** ⚪ pending
- **Por qué:** Alta de tienda (T1 del PRD) pasa por un flow multi-step con validación de admin.
- **Entregable:** `features/store-onboarding/` conectada a auth real + upload de docs de validación (B5.4) + crear registro en `stores` con `status = pending_validation`.
- **Archivos:** `features/store-onboarding/**`.
- **Depends on:** B4.4, B5.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B10.2 — Swap availability toggle + location publishing
- **Estado:** ⚪ pending
- **Por qué:** Invariante PRD §7.5 — tienda publica ubicación cada 30-60s mientras está activa. Descarte de lecturas con error >50m.
- **Entregable:** Hook `useAvailability` + hook `useLocationPublisher(storeId)` que lee `geolocation.watchPosition`, filtra lecturas por `accuracy <= 50`, INSERT en `store_locations` cada 30-60s. Toggle server-side que actualiza `stores.available`.
- **Archivos:** `features/store-dashboard/hooks/useAvailability.ts`, `useLocationPublisher.ts`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `data-batch-inserts` (si se buffering)
- **REGISTRY:** `features.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B10.3 — Swap catálogo CRUD + image upload
- **Estado:** ⚪ pending
- **Por qué:** T3 del PRD — gestión completa del catálogo.
- **Entregable:** `features/catalog/` consume `ProductsRepository` (CRUD) + `StorageService.upload` para fotos. Server Actions para create/update/delete. Tests.
- **Archivos:** `features/catalog/**`.
- **Depends on:** B3.1, B5.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B10.4 — Swap incoming orders inbox + realtime
- **Estado:** ⚪ pending
- **Por qué:** T5 del PRD — bandeja de pedidos entrantes en vivo.
- **Entregable:** Feature que consume `OrdersRepository.findByStoreAndStatus('RECIBIDO')` + subscription realtime al canal `orders:store_id=$id`. Notificación sonora opcional.
- **Archivos:** `features/store-dashboard/components/IncomingOrders/`.
- **Depends on:** B6.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B10.5 — Swap accept/reject/finalize state transitions
- **Estado:** ⚪ pending
- **Por qué:** T6 y T7 del PRD. Cada transición es una Server Action que valida rol + state machine + emite event.
- **Entregable:** Server Actions `acceptOrder`, `rejectOrder`, `finalizeOrder` en `features/orders/actions.ts` (tienda). Cada una es transacción corta, emite domain event post-commit (triggers B8 push).
- **Archivos:** `features/orders/actions.ts` (tienda), tests.
- **Depends on:** B9.4
- **Continues with:** —
- **Skill rules aplicables:** `lock-short-transactions`
- **REGISTRY:** —
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B10.6 — Swap store profile + logo upload
- **Estado:** ⚪ pending
- **Por qué:** T6 del PRD — tienda edita su perfil (nombre, descripción, horarios, logo).
- **Entregable:** `features/store-profile/` con edit form + upload de logo via `StorageService`.
- **Archivos:** `features/store-profile/**`.
- **Depends on:** B5.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B10.7 — Swap analytics básico de tienda
- **Estado:** ⚪ pending
- **Por qué:** F13.7 del frontend epic, depende de KPIs. Reemplaza el mock por queries reales contra `orders` agregados.
- **Entregable:** `features/store-analytics/` consume queries SQL agregadas via repository. Charts básicos (pedidos/día, tasa de aceptación, tiempo promedio de respuesta).
- **Archivos:** `features/store-analytics/**`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `query-composite-indexes`
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B10.8 — Swap push subscribe de tienda
- **Estado:** ⚪ pending
- **Por qué:** Tienda opta por notifs para recibir alertas de pedidos nuevos (T8 del PRD).
- **Entregable:** Flow de opt-in en dashboard tienda, análogo a B9.8 pero con copy orientado a tienda ("Recibí avisos de pedidos nuevos").
- **Archivos:** `features/store-dashboard/components/NotificationOptIn/`.
- **Depends on:** B8.1
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** S
- **Notas:** (se llena al cerrar)

---

# FASE B11 — Swap admin (features Admin consumen backend real)

**Goal:** Reemplazar mocks del panel admin por queries reales. KPIs, validación de tiendas, moderación, audit log, user management.
**Acceptance criteria:** Admin puede ver KPIs en vivo, aprobar/rechazar tiendas pendientes con documentos adjuntos, moderar productos, auditar pedidos históricos, gestionar usuarios.

### B11.1 — Swap dashboard KPIs
- **Estado:** ⚪ pending
- **Por qué:** A3 del PRD — dashboard con las métricas del §8.
- **Entregable:** Server-side queries agregadas (orders aceptados, rate de aceptación, stores activos, etc.). Consumido por `features/admin-kpi-dashboard`.
- **Archivos:** `features/admin-kpi-dashboard/**`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `query-composite-indexes`, `data-pagination`
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B11.2 — Swap store validation queue
- **Estado:** ⚪ pending
- **Por qué:** A1 del PRD — admin aprueba/rechaza altas de tienda. Incluye visor de documentos.
- **Entregable:** `features/store-validation` + `features/admin-store-validation` consumen repository + storage (docs). Server Actions `approveStore`, `rejectStore(reason)`.
- **Archivos:** `features/admin-store-validation/**`.
- **Depends on:** B5.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B11.3 — Swap content moderation
- **Estado:** ⚪ pending
- **Por qué:** A2 del PRD — admin revisa productos reportados y puede eliminar contenido.
- **Entregable:** `features/content-moderation/` consume repository de productos con flag `reported=true`. Actions: `hideProduct`, `warnStore`, `suspendStore`.
- **Archivos:** `features/content-moderation/**`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B11.4 — Swap audit log reader
- **Estado:** ⚪ pending
- **Por qué:** F14.4 del frontend — admin audita pedidos históricos (para disputes, incidentes).
- **Entregable:** `features/admin-audit-log/` consume `AuditLogRepository.find(filters)` con paginación keyset. Tabla readonly.
- **Archivos:** `features/admin-audit-log/**`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `data-pagination`
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B11.5 — Swap user management
- **Estado:** ⚪ pending
- **Por qué:** F14.5 del frontend. Admin puede suspender/reactivar usuarios; ver sus pedidos.
- **Entregable:** `features/user-management/` consume `UsersRepository`. Actions `suspendUser`, `reactivateUser`.
- **Archivos:** `features/user-management/**`.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B11.6 — Ensure audit_log append-only enforcement (trigger)
- **Estado:** ⚪ pending
- **Por qué:** El invariante de `audit_log` inmutable (F16.2 frontend) necesita un trigger SQL que bloquee UPDATE y DELETE, incluso con service role.
- **Entregable:** migración con trigger `before update or delete on audit_log raise exception`. RLS ya lo restringe para anon/authenticated, pero service_role lo saltea — el trigger lo blinda contra bugs propios.
- **Archivos:** `supabase/migrations/<ts>_audit_log_immutability.sql`.
- **Depends on:** B1.2
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `domain.md`.
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B11.7 — Swap audit_log writer en Server Actions críticas
- **Estado:** ⚪ pending
- **Por qué:** Cada transición del pedido, cada acción admin, cada cambio de RLS efectivo debe escribir en `audit_log`. Sin esto, B11.4 queda vacío.
- **Entregable:** Helper `writeAuditEntry(actor, action, subject, payload)` que se invoca desde las Server Actions de admin y de transiciones. Parte de la misma transacción que la acción.
- **Archivos:** `shared/domain/audit-log.ts`, integración en Server Actions de B9/B10/B11.
- **Depends on:** B11.6, B9.4, B10.5
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `domain.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

# FASE B12 — Observability backend

**Goal:** Instalar la visibilidad mínima para diagnosticar y alertar sobre problemas de performance / errores.
**Acceptance criteria:** Panel admin permite leer top slow queries de `pg_stat_statements`; Sentry recibe queries >100ms mean; logs server-side son estructurados con request IDs.

### B12.1 — Admin panel: top slow queries (pg_stat_statements reader)
- **Estado:** ⚪ pending
- **Por qué:** `pg_stat_statements` ya está habilitada desde B1.1. Hay que exponer sus datos al admin para diagnóstico.
- **Entregable:** Route Handler `app/api/admin/slow-queries/route.ts` + componente `features/admin-observability/SlowQueriesPanel` que lista top 20 queries por mean_exec_time. Protegido por role check.
- **Archivos:** `app/api/admin/slow-queries/route.ts`, `features/admin-observability/**`.
- **Depends on:** B1.1
- **Continues with:** —
- **Skill rules aplicables:** `monitor-pg-stat-statements`
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B12.2 — Slow query alerts → Sentry
- **Estado:** ⚪ pending
- **Por qué:** Dashboard admin sirve para investigar; alertas sirven para no descubrir el problema tarde.
- **Entregable:** Cron `/api/cron/check-slow-queries` cada 5 min que lee `pg_stat_statements`, compara con baseline, y manda breadcrumb/event a Sentry si un query cruzó el umbral (100ms mean, o +50% vs semana pasada).
- **Archivos:** `app/api/cron/check-slow-queries/route.ts`, schedule en B7.1 migración (patch).
- **Depends on:** B12.1, B7.1
- **Continues with:** —
- **Skill rules aplicables:** `monitor-pg-stat-statements`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B12.3 — Structured server-side logging con request IDs
- **Estado:** ⚪ pending
- **Por qué:** F8.5 del frontend epic dejó structured logging server-side como ✅, pero no estaba wireado a Supabase. Hay que asegurar que cada Server Action / Route Handler propague un `requestId` a cada log y a Sentry.
- **Entregable:** Middleware que inyecta `X-Request-Id` header; helper `logger.withRequestId(req)` en `shared/services/logger.ts`. Integración con las Route Handlers nuevas de B7/B8/B12.
- **Archivos:** `middleware.ts` (patch), `shared/services/logger.ts` (patch).
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `data.md` (sección Logger).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B12.4 — Supabase logs → Sentry breadcrumbs
- **Estado:** ⚪ pending
- **Por qué:** Errores en Supabase (ej: connection pool exhausted) hoy se ven solo en su dashboard. Llevarlos a Sentry junto a los errores de la app da contexto.
- **Entregable:** Webhook de Supabase → Sentry via route handler `/api/webhooks/supabase-logs`. Captura errors level >= warning.
- **Archivos:** `app/api/webhooks/supabase-logs/route.ts`, config en Supabase dashboard (doc en `docs/workflows/supabase-webhooks.md`).
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

---

# FASE B13 — Hardening (rate limiting real, seed data, runbooks)

**Goal:** Llevar el backend de "funciona en dev" a "soporta tráfico real sin descuidos operacionales".
**Acceptance criteria:** Rate limiting real sobre endpoints sensibles; seed data útil para devs nuevos; runbooks para los escenarios de incidente más probables; security smoke tests corriendo en CI.

### B13.1 — Rate limiting in-DB (leaky bucket con tabla + RLS)
- **Estado:** ⚪ pending
- **Por qué:** F16.1 del frontend dejó rate limiting como ✅ pero mockeado. Para prod necesitamos algo real. Elegimos in-DB vs Upstash por simplicidad y portabilidad (Upstash queda en NEXT-TASK.md como alternativa si la escala lo requiere).
- **Entregable:** Tabla `rate_limit_buckets` + función `check_rate_limit(key text, max int, window_seconds int)`. Middleware que la invoca en endpoints sensibles (submit order, push subscribe, auth attempts).
- **Archivos:** `supabase/migrations/<ts>_rate_limit.sql`, `shared/services/rate-limit.supabase.ts`, integración en middleware o por-endpoint.
- **Depends on:** B3.1
- **Continues with:** —
- **Skill rules aplicables:** `lock-short-transactions`, `lock-advisory`
- **REGISTRY:** `data.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B13.2 — Seed data fixtures para dev
- **Estado:** ⚪ pending
- **Por qué:** Un dev nuevo corriendo `pnpm supabase:reset` debería tener un entorno utilizable (tiendas, productos, users, algunos orders en distintos estados) sin hacer onboarding manual.
- **Entregable:** `supabase/seed.sql` con: 3 users (1 cliente, 1 tienda, 1 admin); 5 tiendas (distintas zonas de CABA); 20 productos; 10 orders distribuidas en los estados. Doc en `docs/workflows/dev-seed.md`.
- **Archivos:** `supabase/seed.sql`, `docs/workflows/dev-seed.md`.
- **Depends on:** B1.2, B4.1
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `testing.md` (sección Seed data).
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B13.3 — Runbook: rollback de migración
- **Estado:** ⚪ pending
- **Por qué:** Una migración en prod que rompe algo es un escenario garantizado. Sin runbook, el miedo a rollback es peor que la regresión.
- **Entregable:** `docs/runbooks/migration-rollback.md` con playbook paso a paso — desde `supabase db diff` para entender el delta, hasta `migration down` manual o migración inversa.
- **Archivos:** `docs/runbooks/migration-rollback.md`.
- **Depends on:** B0.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B13.4 — Runbook: incident response
- **Estado:** ⚪ pending
- **Por qué:** "La prod está caída". Sin runbook, cada incidente es caos fresco.
- **Entregable:** `docs/runbooks/incident-response.md` con: triage (pg_stat_activity, connection pool, Sentry), escalations, comunicación al usuario, post-mortem template.
- **Archivos:** `docs/runbooks/incident-response.md`.
- **Depends on:** B12.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B13.5 — Security smoke tests en CI
- **Estado:** ⚪ pending
- **Por qué:** Detectar regresiones comunes: SQL injection en inputs, bypass de RLS por cliente anónimo, endpoints sin rate limit.
- **Entregable:** Suite en `e2e/security/` con: (a) fuzzing de inputs en Server Actions críticas; (b) intento de leer tabla con anon role y expectar vacío/error; (c) flood de 100 req/s a auth endpoint y expectar 429. Integrada a CI como job separado.
- **Archivos:** `e2e/security/*.spec.ts`, `.github/workflows/ci.yml` (patch).
- **Depends on:** B13.1, B2.3
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `testing.md`.
- **Estimación:** L
- **Notas:** (se llena al cerrar)

---

# FASE B14 — Deploy producción

**Goal:** Llevar el backend a Supabase Cloud, configurar secrets, pipeline de migraciones con approval, y cerrar go-live checklist.
**Acceptance criteria:** Supabase project de prod existe con secrets inyectados; cada PR que modifica `supabase/migrations/` corre preview contra un branch; merge a main despliega via release-please; checklist de disaster recovery al día.

### B14.1 — Crear proyecto Supabase Cloud + inyectar secrets
- **Estado:** ⚪ pending
- **Por qué:** Prod sin proyecto no puede arrancar. Los secrets (SERVICE_ROLE_KEY, VAPID, CRON_SECRET, Google OAuth) deben estar en Vercel env vars + Supabase dashboard.
- **Entregable:** Proyecto Supabase Cloud creado, región AWS SA-East-1 (baja latencia desde Argentina). Secrets inyectados en Vercel (prod + preview) y en Supabase dashboard. Doc en `docs/runbooks/prod-setup.md`.
- **Archivos:** `docs/runbooks/prod-setup.md`.
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** `conn-pooling`
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

### B14.2 — Pipeline CI: preview DB por PR (Supabase branching opcional) → approval → prod
- **Estado:** ⚪ pending
- **Por qué:** Mergear una migración directo a prod es peligroso. Pipeline con preview + approval lo mitiga.
- **Entregable:** Workflow `deploy-prod.yml` que: (a) en PR, crea un branch de Supabase + corre migraciones + tests E2E; (b) en merge, requiere approval humano; (c) al aprobar, corre migraciones contra prod via `supabase db push`. Si Supabase Branching no está disponible en el tier contratado, el preview corre en Docker local en el runner.
- **Archivos:** `.github/workflows/deploy-prod.yml`.
- **Depends on:** B14.1, B0.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** L
- **Notas:** (se llena al cerrar)

### B14.3 — Release-please integration
- **Estado:** ⚪ pending
- **Por qué:** F17.4 del frontend dejó release-please configurado. Hay que asegurar que los cambios de `supabase/migrations/` disparen release notes correctas.
- **Entregable:** `release-please-config.json` ajustado para que migraciones aparezcan en el CHANGELOG bajo sección "Database".
- **Archivos:** `release-please-config.json` (patch).
- **Depends on:** —
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** S
- **Notas:** (se llena al cerrar)

### B14.4 — Go-live checklist + disaster recovery baseline
- **Estado:** ⚪ pending
- **Por qué:** Antes del primer usuario externo, validar que backups están on, que hay un playbook si se cae todo, que los rate limits están set, que Sentry alerta llega a alguien.
- **Entregable:** `docs/runbooks/go-live-checklist.md` con 20-30 items accionables. `docs/runbooks/disaster-recovery.md` con: RTO/RPO objetivos, cómo restaurar desde backup, cómo failover manual.
- **Archivos:** `docs/runbooks/go-live-checklist.md`, `docs/runbooks/disaster-recovery.md`.
- **Depends on:** B14.2, B13.4
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** —
- **Estimación:** M
- **Notas:** (se llena al cerrar)

---

## Decisiones de negocio documentadas en este epic

Estas decisiones no aparecen explícitas en PRD.md ni en EPIC-ARCHITECTURE.md pero deben quedar registradas porque condicionan tareas de este epic. Si se contradicen en el futuro, el epic se replanifica.

| # | Decisión | Fuente | Impacto |
|---|---|---|---|
| BD-1 | Retención de `audit_log` indefinida en MVP. Purga mensual (pedidos > 2 años) queda en NEXT-TASK.md. | decisión del brainstorming | B11.6, B13 |
| BD-2 | Retención de `store_locations` limitada a 30 días (append-only con cleanup automático). | invariante del PRD §7.5 + costo de storage | B10.2, B13 |
| BD-3 | Rate limits iniciales: 10 orders/h por cliente; 100 login attempts/h por IP; 1000 push sends/h global. Ajustables via env. | expert recommendation | B13.1 |
| BD-4 | Region Supabase: AWS SA-East-1 (baja latencia desde Argentina — alineado con DP-7). | DP-7 del epic frontend | B14.1 |
| BD-5 | Ubicación del cliente: se guarda en `orders.customer_location_point` (PostGIS `geography(point)`). El acceso se controla con RLS: el cliente ve siempre la suya; la tienda la ve **solo vía la security definer function `get_visible_customer_location(order_id)` que retorna NULL si `order.status < 'ACEPTADO'` o si el caller no es la tienda dueña**. No se encripta a nivel columna — RLS + función security definer es suficiente para el invariante PRD §7.2 y más simple que pgsodium. | invariante PRD §7.2 | B1.2, B2.1, B2.2 |
| BD-6 | IDs expuestos al cliente vía URL (orders.public_id, stores.public_id): UUID v4 por default (gen_random_uuid). Migración a UUIDv7 diferida a NEXT-TASK.md. | skill rule schema-primary-keys | B1.2 |
| BD-7 | Webhook de Supabase (logs → Sentry) queda detrás de un header secret, no de IP allowlist. | simplicidad operacional | B12.4 |
| BD-8 | **Cambios de schema solo via archivos de migración** en `supabase/migrations/`. Prohibido modificar la DB desde Supabase Studio UI (ni en local ni en prod). El drift check de CI (B0.4) falla si detecta cambios en la DB que no están en archivos de migración. No hay `synchronize:true` estilo ORM — no usamos ORM. | evitar drift schema↔código, auditabilidad | B0.4, todas las tareas con migraciones |

---

## Integración con `shared/REGISTRY.md`

Este epic **va a crecer la superficie de `shared/`** considerablemente:

- **Nuevos archivos en `shared/repositories/supabase/`** — 6-8 repositories (B3.1).
- **4 facades implementados** — `auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`, `push.supabase.ts` (B3.2, B4, B5, B6, B8).
- **Nuevas utilities** — `image-upload.ts` (B5.3), `audit-log.ts` (B11.7), etc.
- **Nuevos hooks compartidos** — `useRealtimeInvalidation` (B6.3).

**Regla dura:** cada tarea que lista un archivo en `shared/` en su campo `Archivos:` **debe actualizar `shared/REGISTRY.md` (índice) y el detail file correspondiente (`shared/REGISTRY-detail/*.md`) en el mismo commit**. El campo `REGISTRY:` de cada bloque de tarea lista explícitamente cuál detail file actualizar. Si la tarea no actualiza el REGISTRY, el PR no mergea.

---

## Changelog del epic

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Creación del epic backend (EPIC-BACKEND.md) a partir del brainstorming documentado en la conversación: shape 3 validado contra skill supabase-postgres-best-practices, 9 incorporaciones de la skill, 15 fases, ~75 tareas. |
