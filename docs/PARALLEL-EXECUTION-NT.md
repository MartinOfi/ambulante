# Plan de ejecución paralela — NEXT-TASK parking lot

> **Qué es este doc:** guía operativa para resolver todos los items accionables de [`docs/NEXT-TASK.md`](./NEXT-TASK.md) en el menor tiempo posible, maximizando el paralelismo. Espejo de [`PARALLEL-EXECUTION-BACKEND.md`](./PARALLEL-EXECUTION-BACKEND.md) pero para el parking lot de mejoras post-epic.
>
> **Cómo se usa:** verificá el gating de la fase, abrí los chats de la wave, usá `/start NT-XX` dentro de cada uno. Los items trigger-deferred de la Fase 6 no se ejecutan hasta que sus disparadores de negocio se cumplan.

---

## ⚠️ Leé esto primero — Waves ≠ lotes secuenciales

Igual que en el epic backend: **una Wave NO es un lote que termina antes de la siguiente**. Es una **ventana de desbloqueo** — define el momento más temprano en que sus tareas pueden empezar. Las waves anteriores **siguen vivas en sus chats** mientras abrís la siguiente.

```
✅ CORRECTO
"Wave A arranca en T0.
 Wave B arranca apenas se cumpla SU gating, aunque la
 Wave A todavía tenga chats vivos. Conviven en paralelo."

❌ INCORRECTO
"Termino toda la Wave A, después arranco la Wave B"
```

---

## Glosario

- **Wave A/B/C…** = ventana de desbloqueo dentro de una fase. Tareas de la misma wave son paralelas entre sí.
- **Gating** = condición que destraba la wave.
- **⚠️ conflicto** = archivo compartido con otro chat de la misma wave — coordinar orden de merge.
- **Tier 1** = TS-only, ≤5 archivos, sin SQL/RLS/auth/facade nuevo, estimación S/M → branch normal, sin worktree.
- **Tier 2** = L/XL o multi-feature → worktree liviano.
- **Tier 3** = SQL, migration, RLS, auth flow, facade/repo nuevo → worktree + Supabase shared + gates completos.

---

## Estado inicial — items ya resueltos (marcar ✅ en NEXT-TASK.md)

Antes de ejecutar cualquier fase, actualizar `docs/NEXT-TASK.md` para reflejar que estos dos items ya están hechos:

| Item | Estado real | Evidencia |
|---|---|---|
| NT-30 "Resolver pares con timestamp duplicado" | ✅ **ya resuelto** en B12-A | `supabase/migrations/` usa timestamps únicos `0008`/`0009` — `pnpm supabase db reset` pasa limpio |
| NT-32 "Vitest: 9 tests fallan" | ✅ **ya resuelto** | `pnpm vitest run` retorna 1997 tests pasando, 0 fallos (verificado 2026-05-06) |

---

## Errores de documentación en NEXT-TASK.md

`NT-30` aparece **tres veces** en el cuerpo del doc con contenido diferente. Son tres items distintos colapsados en el mismo ID:

| ID real | Título | Estado |
|---|---|---|
| NT-30 (original) | Resolver timestamps duplicados en migrations | ✅ **ya hecho** |
| NT-30b | Documentar `SUPABASE_WEBHOOK_SECRET` en `.env.example` | ⬜ pendiente |
| NT-30c | Compatibilidad Node 24 al cargar `next.config.ts` | ⬜ pendiente |

En este plan se usan los sufijos `b` y `c` para distinguirlos. Al ejecutar, usá `/start NT-30b` o `/start NT-30c` con el texto del item.

---

## Items accionables (ejecutar en Fases 0–5)

| ID | Título | Cat | Estim | Tier | Fase |
|---|---|---|---|---|---|
| NT-41 | `toUser()` devuelve `auth.uid()` en vez de `public_id` | backend | S | 1 | 0 |
| NT-37 | Tests fallan sin env vars de Supabase | testing/DX | S | 1 | 0 |
| NT-38 | Borrar `orders.mock.ts` (B10-C ya ✅) | refactor | S | 1 | 1 |
| NT-30b | `SUPABASE_WEBHOOK_SECRET` en `.env.example` | DX | S | 1 | 1 |
| NT-30c | Compatibilidad Node 24 en `next.config.ts` | infra/DX | S | 1 | 1 |
| NT-29 | `resizeImageForUpload`: tipar dimensions como nullable | types/DX | S | 1 | 1 |
| NT-26 | VAPID: mejorar mensajes de error de paridad | backend/DX | S | 1 | 1 |
| NT-31 | Push routes → `SupabasePushSubscriptionRepository` | backend/arch | S | 1 | 1 |
| NT-33 | Robustez cleanup + types en `concurrent-fixtures` | testing/DX | S | 1 | 1 |
| NT-36 | Guard CI contra timestamps duplicados de migrations | infra/DevEx | S | 1 | 1 |
| NT-27 | Mover `ALTER DATABASE SET` de seed.sql a migración | infra/DX | S | **3** | 2 |
| NT-28 | Agregar `received_at` a la tabla `orders` | schema | S | **3** | 2 |
| NT-43 | `fetchAuditLog` → tipo discriminado (ok/not_found/error) | backend/UX | M | 2 | 3 |
| NT-34 | Paginación real en listado admin de usuarios | backend/perf | M | 2 | 3 |
| NT-35 | Focus trap + Escape en modales admin (shadcn Dialog) | a11y/UX | M | 2 | 3 |
| NT-40 + NT-42 | `create()` sin TX + relajar Store Zod schema | backend | M | 2 | 3 |
| NT-02 | Previsualizador de imagen al crear/editar producto | UX | S | 1 | 4 |
| NT-03 | Precarga de theme (evitar flash blanco → dark) | UX/perf | M | 2 | 4 |
| NT-39 | E2E happy path cliente (cart→submit→tracking→cancel) | testing/E2E | M | 2 | 5 |

---

## Items trigger-deferred (Fase 6 — no ejecutar hasta disparador)

| ID | Título | Disparador |
|---|---|---|
| NT-01 | Mejorar la UI (placeholder, a detallar) | usuario descompone los sub-items |
| NT-04 | Apple OAuth | >20% usuarios iOS instalando PWA |
| NT-05 | Avatar de usuario + bucket + UI | feature de perfil cliente prioritaria / NT-13 |
| NT-06 | Entorno staging (Supabase Cloud) | >1 dev regular en el proyecto |
| NT-07 | Supabase Branching por PR | >3 PRs/semana con cambios de schema |
| NT-08 | Migrar `public_id` a UUIDv7 | alguna tabla > 10M filas con queries lentas |
| NT-09 | Rate limiting → Upstash/Redis | >1000 req/s o `check_rate_limit` en top-10 slow queries |
| NT-10 | Visual regression tests (Storybook) | >3 bugs visuales por regresión en 30 días |
| NT-11 | Monorepo (Turborepo) | 2+ apps compartiendo código |
| NT-12 | Purga periódica de `audit_log` y `store_locations` | tablas > 10 GB o `supabase db dump` > 10 min |
| NT-13 | Rating / reputación bidireccional | >1k pedidos/mes + disputas |
| NT-14 | Chat en vivo cliente ↔ tienda | pedidos cancelados por falta de comunicación (métricas) |
| NT-15 | Favoritos + seguimiento de tiendas | >20% clientes que vuelven a la misma tienda |
| NT-16 | Notificaciones por proximidad | post NT-15 |
| NT-17 | Programación anticipada de pedidos | feedback "pido para más tarde" frecuente |
| NT-18 | Filtros por categoría de producto | >50 tiendas activas en mapa |
| NT-19 | Promociones y descuentos publicables | tiendas lo piden en entrevistas/support |
| NT-20 | Verificación de identidad (KYC) | regulación local lo exige / >10 incidentes de fraude |
| NT-21 | Modelo de monetización (suscripción premium) | ≥1000 tiendas activas + señal de disposición a pagar |
| NT-22 | Predicción de demanda (ML) | >6 meses de data histórica (10k+ pedidos) |
| NT-23 | Modo offline completo + sincronización diferida | >30% usuarios con conectividad mala |
| NT-24 | App nativa iOS | iOS >50% del uso + quejas frecuentes de push/geoloc |
| NT-25 | Observabilidad avanzada (OpenTelemetry) | incidente que Sentry + logs + pg_stat_statements no diagnosticaron |

---

# FASE 0 — Bugs críticos

**Pre-requisito:** ninguno (arrancar acá).
**Total de chats:** 2.
**Pico paralelo:** 2.

> Estos bugs están **silenciosos hoy** porque los hooks siguen corriendo con mocks. En cuanto cualquier feature conecte Supabase real, NT-41 rompe todos los lookups por `owner_id` y NT-37 rompe la suite en checkout fresh. Ambos deben salir antes de cualquier tarea que conecte el backend real.

### Wave A — arranque inmediato (2 chats — T0)

**Gating:** ninguno.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-41` | `shared/services/auth.supabase.ts` (toUser, toSession), `auth.supabase.test.ts` | 1 | Agregar lookup `public.users where auth_user_id = ?` + cache por sesión. |
| 2 | `NT-37` | `shared/repositories/supabase/client.ts` (lazy-load), `vitest.setup.ts` (env stubs) | 1 | Elegir opción (a) lazy-load o (b) env stubs dummy. No bloquea chats vivos. |

> ⚠️ **Sin conflictos:** archivos completamente distintos. Mergear en cualquier orden.

**Cierre de Fase 0:** 2 items ✅. Destraba Fases 2, 3 y 5.

> **La Fase 1 puede arrancar en paralelo con la Fase 0** (T0 también). No hay dependencia entre ellas.

---

# FASE 1 — Quick wins (S, Tier 1, sin dependencias entre sí)

**Pre-requisito:** ninguno — **arranca en T0 junto con Fase 0**.
**Total de chats:** 8.
**Pico paralelo:** 8.

> Todos estos items son independientes entre sí y de la Fase 0. No comparten archivos críticos. Se pueden abrir todos a la vez.

### Wave A — arranque inmediato (8 chats — T0)

**Gating:** ninguno.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-38` | `features/orders/services/orders.mock.ts`, `features/orders/services/index.ts`, tests de tienda | 1 | Grep `orders.mock` → 0 imports → borrar. `pnpm typecheck` + suite verde. |
| 2 | `NT-30b` | `.env.example` | 1 | 1 archivo. Agregar bloque comentado con instrucción `openssl rand -hex 32`. |
| 3 | `NT-30c` | `next.config.ts`, `shared/config/env.runtime.ts`, `package.json`, `.nvmrc` | 1 | Opción (a): inline `parseEnv` en `next.config.ts` sin pasar por `env.runtime`. Opción (c): pinear a Node 20 en `engines` + `.nvmrc`. |
| 4 | `NT-29` | `shared/utils/image-upload.ts`, `shared/utils/image-upload.test.ts` | 1 | `ResizeImageResult.originalDimensions` y `outputDimensions` → `ImageDimensions \| null`. Callers en `features/catalog/` si existen. |
| 5 | `NT-26` | `shared/config/env.schema.ts`, `shared/config/env.test.ts` | 1 | `superRefine` con 3 ramas explícitas: solo client key / solo server key / mismatch. |
| 6 | `NT-31` | `app/api/push/subscribe/route.ts`, `route.test.ts`, `app/api/push/unsubscribe/route.ts`, `route.test.ts`, `shared/repositories/supabase/push-subscriptions.supabase.ts` | 1 | Instanciar `SupabasePushSubscriptionRepository` en ambas rutas. Alinear mecanismo de resolución de user. |
| 7 | `NT-33` | `app/api/cron/_test-helpers/concurrent-fixtures.ts` | 1 | (a) `cleanupIdentity` lanza si cualquier step falla. (b) Zod schema local en vez de `as` casts. Solo test-helper — blast radius cero. |
| 8 | `NT-36` | `.github/workflows/ci.yml`, `scripts/check-migration-timestamps.sh` (nuevo) | 1 | Script que extrae prefijos de 14 chars, falla si hay duplicados. Agrega step al job `db-migrations`. |

> ⚠️ **Conflicts potenciales:**
> - Chat 3 (NT-30c) toca `package.json` — coordinar merge si hay otro chat activo que también edite `package.json`. En este grupo no hay otro.
> - Chat 5 (NT-26) toca `env.schema.ts`; Chat 3 (NT-30c) toca `env.runtime.ts`. **Archivos distintos** — sin conflicto.
> - Chat 6 (NT-31) toca `push-subscriptions.supabase.ts` — sin conflicto con los demás.

**Cierre de Fase 1:** 8 items ✅. Destraba Fase 5 junto con Fase 0.

---

# FASE 2 — SQL migrations (Tier 3)

**Pre-requisito:** Fase 0 ✅ (NT-41 + NT-37). Tests y auth correctos antes de aplicar migraciones.
**Total de chats:** 2.
**Pico paralelo:** 2.

> Ambas son migraciones SQL pequeñas. Pueden correr en paralelo con sus worktrees. Solo hay que coordinar que los timestamps de migración sean distintos (pre-acordar antes de arrancar).

### Wave A — arranque (2 chats)

**Gating:** `Fase 0 ✅`.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-27` | `supabase/seed.sql` (remover líneas), `supabase/migrations/<ts>_schedule_crons.sql` o nueva migración | **3** | Mover `ALTER DATABASE postgres SET "app.settings.*"` de seed a migración. `pnpm supabase:start` debe completar sin errores de seeding. |
| 2 | `NT-28` | `supabase/migrations/<ts>_add_received_at.sql` (nuevo), `app/api/cron/expire-orders/route.ts` | **3** | Columna `received_at timestamptz` + backfill con `updated_at`. Actualizar `buildOrderForTransition` para leer el campo real. |

> ⚠️ **Timestamp coordination:** pre-acordar qué slot usa cada uno antes de arrancar para no colisionar. Sugerencia: NT-27 usa `20260507000001` y NT-28 usa `20260507000002`.
>
> ⚠️ **Supabase single-instance:** si ambos chats necesitan correr `supabase db reset` para verificar, serializarlos con **Estrategia S2** (turnos coordinados). El desarrollo TS puede correr en paralelo.

**Cierre de Fase 2:** 2 items ✅.

---

# FASE 3 — Fixes M (multi-archivo, Tier 2)

**Pre-requisito:** Fase 0 ✅.
**Total de chats:** 4.
**Pico paralelo:** 3 (Wave A) → luego 1 (Wave B con NT-40+NT-42).

### Wave A — arranque (3 chats)

**Gating:** `Fase 0 ✅`.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-43` | `features/admin-audit-log/actions/fetch-audit-log.ts`, `hooks/useAuditLogQuery.ts`, `components/OrderAuditLog/OrderAuditLog.container.tsx`, `types/audit-log.types.ts` | 2 | Tipo discriminado `{ status: "ok" \| "not_found" \| "error" }`. 4 archivos en el mismo feature — sin conflictos externos. |
| 2 | `NT-34` | `shared/repositories/supabase/users.supabase.ts`, `shared/repositories/user.ts`, `shared/repositories/mock/user.mock.ts`, `features/user-management/hooks/useUsersQuery.ts`, `features/user-management/components/UserManagementPage/**` | 2 | `UserFilters` con `limit` + `offset`. Hook con `page` en query key. UI con controles de paginación. |
| 3 | `NT-35` | `features/user-management/components/SuspendConfirmDialog/**`, `features/store-validation/*ConfirmDialog*`, `features/content-moderation/*ConfirmDialog*` | 2 | Migrar todos los `*ConfirmDialog` al primitivo `<Dialog>` de shadcn. Cross-feature pero cada componente es independiente. |

> ⚠️ **Sin conflictos entre Wave A:** los 3 chats tocan features distintas y no comparten `shared/`.

### Wave B — se desbloquea **apenas Wave A empiece** (1 chat)

**Gating:** conviene esperar a que `NT-34` cierre (ambos tocan `shared/repositories/supabase/stores.supabase.ts`), pero en principio NT-40+NT-42 no dependen de NT-34. Arrancar Wave B cuando hayas confirmado que NT-34 no va a tocar `stores.supabase.ts`.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 4 | `NT-40 + NT-42` | `shared/schemas/store.ts`, `shared/repositories/store.ts`, `shared/repositories/supabase/stores.supabase.ts`, `features/store-onboarding/server-actions/`, posibles ajustes en `features/map/`, `features/store-profile/` | 2 | **SERIAL en el mismo chat:** primero NT-42 (relajar schema: `photoUrl`, `tagline`, `priceFromArs` opcionales), luego NT-40 (dedup/idempotencia en `create()`). NT-42 define cómo `create()` maneja `undefined` → deben salir en el mismo PR. |

> ⚠️ **NT-40 + NT-42 son un único chat.** Ambos tocan `stores.supabase.ts`. Partir en dos PRs crearía conflictos de merge y lógica parcialmente rota entre commits.

**Cierre de Fase 3:** 4 chats, 5 items ✅.

---

# FASE 4 — Mejoras de frontend (UX/perf)

**Pre-requisito:** ninguno formal — **puede arrancar en T0 junto con Fases 0 y 1**.
**Total de chats:** 2.
**Pico paralelo:** 2.

> Estos items son puramente de UI/frontend. No dependen de fixes de auth ni de migraciones SQL. Pueden ejecutarse en paralelo con las demás fases sin problema.

### Wave A — arranque inmediato (2 chats — T0)

**Gating:** ninguno.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-02` | `features/catalog/components/ProductForm/`, `features/catalog/components/ProductImagePreview/` (nuevo) | 1 | Thumbnail inmediato en upload/URL paste. Error visible si imagen rota. |
| 2 | `NT-03` | `app/layout.tsx`, `shared/providers/ThemeProvider.tsx`, `app/globals.css` | 2 | Script inline en `<head>` antes del primer render. Patrón: `localStorage` + `prefers-color-scheme` → `document.documentElement.dataset.theme`. Lighthouse Perf ≥ 90. |

> ⚠️ **Sin conflictos entre sí:** archivos totalmente distintos.

**Cierre de Fase 4:** 2 items ✅.

---

# FASE 5 — E2E (requiere ambiente estable)

**Pre-requisito:** `Fase 0 ✅ AND Fase 1 ✅` (auth correcto + tests verdes sin env vars).
**Total de chats:** 1.
**Pico paralelo:** 1.

> NT-39 requiere: (a) Supabase local con seed completo (B13-B ✅ ya hecho), (b) sesión de cliente real vía cookie (`setSessionCookie`), (c) tienda activa + productos seedados. La corrección de NT-41 es condición para que los session cookies funcionen contra la DB real.

### Wave A — arranque (1 chat)

**Gating:** `Fase 0 ✅ AND Fase 1 ✅`.

| Chat | Item | Archivos clave | Tier | Notas |
|---|---|---|---|---|
| 1 | `NT-39` | `e2e/orders-flow.spec.ts` (nuevo), `supabase/seed.sql` (extender con fixture tienda + productos para cliente test) | 2 | Flujo: setSessionCookie → mapa → store detail → add to cart → submit → ver ENVIADO → cancel → ver CANCELADO → history. CI verde. |

> ⚠️ **Dependencia ambiental:** Supabase local debe estar levantado (`pnpm supabase:start`) con seed aplicado. VAPID keys configuradas para que el push opt-in no bloquee el flow (o skippearlo via `--project-filter`).

**Cierre de Fase 5:** 1 item ✅.

---

# FASE 6 — Trigger-deferred (parking lot)

**Pre-requisito:** disparador de negocio cumplido para cada item. **No ejecutar hasta que se cumpla.**

> Estos 24 items NO tienen fecha. Se evalúan periódicamente (ej: revisión mensual del dashboard) y se mueven a un epic cuando su disparador se activa. Está prohibido anticiparlos "por si acaso" — generan deuda técnica sin valor hasta que el producto los necesite.

| Item | Disparador | Dependencias técnicas cuando se active |
|---|---|---|
| NT-01 | Usuario descompone sub-items con 15-30 min | — |
| NT-04 | >20% usuarios iOS instalando PWA | B4 ✅ (Supabase Auth) |
| NT-05 | Ratings (NT-13) o feedback de perfil | B5 ✅ (Storage) |
| NT-06 | >1 dev regular en el equipo | B14 ✅ (prod funcionando) |
| NT-07 | >3 PRs/semana con cambios de schema | B14 ✅ |
| NT-08 | Alguna tabla con `public_id` > 10M filas | B1.2 ✅, staging para testear (NT-06) |
| NT-09 | >1000 req/s o `check_rate_limit` en top-10 slow queries | B13.1 ✅ (rate limit in-DB) |
| NT-10 | >3 bugs visuales por regresión en 30 días | — |
| NT-11 | 2+ apps compartiendo código | NT-24 u otro driver |
| NT-12 | Tablas > 10 GB o `supabase db dump` > 10 min | B7.1 ✅ (pg_cron) |
| NT-13 | >1k pedidos/mes + disputas reales | B14 ✅ + tracción |
| NT-14 | Métricas de CANCELADO por "no llegué" frecuentes | B6 ✅ (Realtime), B14 ✅ |
| NT-15 | >20% clientes que vuelven a la misma tienda | B9 ✅ |
| NT-16 | NT-15 activado | NT-15 ✅, B8 ✅ (push) |
| NT-17 | Feedback "quiero pedir para más tarde" frecuente | B9 ✅, B7 ✅ (cron) |
| NT-18 | >50 tiendas activas en mapa | B9.2 ✅ (map feed) |
| NT-19 | Tiendas lo piden en entrevistas/support | B10 ✅ |
| NT-20 | Regulación local lo exige o >10 incidentes de fraude | B11 ✅ (store validation) |
| NT-21 | ≥1000 tiendas activas + señal de PMF | B14 ✅ + validación de negocio |
| NT-22 | >6 meses de data histórica (10k+ pedidos) | B14 ✅ + pipeline ML externo |
| NT-23 | >30% usuarios con problemas de conectividad | B6 ✅, B9 ✅ |
| NT-24 | iOS >50% del uso + quejas frecuentes de push/geoloc | B14 ✅ + Apple Dev account |
| NT-25 | Incidente que Sentry + logs + pg_stat_statements no resolvieron | B12 ✅ |

---

# Resumen ejecutivo

| Fase | Nombre | Chats | Pico paralelo | Gating | Tier |
|---|---|---|---|---|---|
| 0 | Bugs críticos | 2 | 2 | ninguno (T0) | 1 |
| 1 | Quick wins S | 8 | 8 | ninguno (T0, paralela con Fase 0) | 1 |
| 2 | SQL migrations | 2 | 2 | Fase 0 ✅ | **3** |
| 3 | Fixes M | 4 | 3 (Wave A) | Fase 0 ✅ | 2 |
| 4 | Frontend UX/perf | 2 | 2 | ninguno (T0, paralela con todo) | 1–2 |
| 5 | E2E | 1 | 1 | Fases 0 + 1 ✅ | 2 |
| 6 | Trigger-deferred | — | — | disparadores de negocio | — |

**Total de chats accionables:** 19.
**Pico concurrente teórico (T0 — Fases 0 + 1 + 4):** 12 chats simultáneos.
**Pico concurrente realista manteniendo calidad de review:** 5–6 chats.
**Items trigger-deferred (Fase 6):** 24 — no ejecutar hasta disparador.

---

## Cómo abrir una wave

```bash
# 1. Abrir un chat nuevo por tarea (desde el directorio principal):
cd ~/Desktop/ambulante && claude

# 2. Dentro del chat, arrancar la tarea:
/start NT-41
/start NT-37
# etc.
```

El comando `/start` detecta el Tier automáticamente según el item. Confirmás con Enter o cambiás con `1`/`2`/`3`.

---

## Protocolo operativo

### Antes de abrir una wave

1. Verificar que el gating de esa wave esté cumplido (tareas ✅ en sus fuentes de verdad).
2. Pre-acordar timestamps de migración si la wave toca SQL (Fase 2).
3. No verificar nada más — no importa si chats anteriores siguen vivos.

### Supabase single-instance (aplica a Fase 2)

Solo una instancia de Supabase CLI puede correr en la máquina (puertos fijos 54321-54324). Para la Fase 2:

| Estrategia | Cuándo | Cómo |
|---|---|---|
| **S1 — DB compartida** | Si los chats no hacen `supabase db reset` entre sí | Un solo `pnpm supabase:start`; ambos chats verifican contra la misma DB |
| **S2 — Serializada** | Si algún chat necesita `supabase db reset` para verificar | Turnos coordinados: chat 1 corre reset, verifica, avisa; chat 2 corre reset, verifica |

### Al cerrar un item

1. `/done` en el chat — cierra según tier.
2. Verificar que el item quede marcado como accionado en `docs/NEXT-TASK.md` (moverlo o marcarlo `✅`).
3. `git pull` en el directorio principal para traer actualizaciones.

---

## Anti-patrones comunes

| Anti-patrón | Por qué está mal | Qué hacer |
|---|---|---|
| "Espero a que Fase 0 cierre antes de abrir Fase 1" | Fase 1 no tiene gating — dejas 8 chats sin arrancar. | Abrir Fase 0 y Fase 1 juntas en T0. |
| "Hago NT-40 y NT-42 en chats separados" | Ambos tocan `stores.supabase.ts` → conflicto de merge garantizado. | Un solo chat, NT-42 primero, NT-40 segundo. |
| "Arranco NT-39 (E2E) antes de NT-41 (auth fix)" | El E2E usa cookies de sesión reales; sin NT-41 los lookups por `owner_id` fallan. | Respetar gating de Fase 5. |
| "Ejecuto un item trigger-deferred porque parece útil ahora" | Construye antes de que haya demanda — deuda sin valor. | Esperar el disparador de negocio. |
| "Mergeo NT-27 y NT-28 sin coordinar timestamps" | Timestamps duplicados en migrations rompen `supabase db reset`. | Pre-acordar slots antes de arrancar Fase 2. |

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-05-06 | Creación del plan. 19 chats accionables en 5 fases, pico real ~5-6 paralelos, 24 items trigger-deferred. |
