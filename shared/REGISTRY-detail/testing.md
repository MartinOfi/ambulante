# REGISTRY-detail — Testing utilities

> Contiene: helpers de render, factories de entidades y configuración de test.

---

## §14 — Test utilities

Viven en `shared/test-utils/`. Solo importar en archivos `*.test.ts` / `*.test.tsx`.

### Render — `shared/test-utils/render.tsx`

| Nombre | Firma | Descripción |
|---|---|---|
| `renderWithProviders` | `(ui: ReactElement, options?) => RenderResult` | Renderiza con todos los providers necesarios (QueryClient, NuqsProvider, ThemeProvider). Usar en lugar de `render` de testing-library para cualquier componente que use hooks de datos o URL state |
| `createTestQueryClient` | `() => QueryClient` | Crea un `QueryClient` configurado para tests (sin retries, `staleTime: Infinity`). Útil cuando necesitás acceso directo al client en el test |

Opciones de `renderWithProviders`:
```ts
{
  queryClient?: QueryClient;   // inyectar uno custom con datos pre-cargados
  initialEntries?: string[];   // rutas iniciales para react-router / next navigation mock
}
```

**Barrel `shared/test-utils/index.ts`** re-exporta:
- Todo de `@testing-library/react` (`screen`, `fireEvent`, `waitFor`, `act`, etc.)
- `userEvent` desde `@testing-library/user-event`
- `renderWithProviders`, `createTestQueryClient`
- Todas las factories

**Uso canónico:**
```ts
import { renderWithProviders, screen, userEvent, createStore } from '@/shared/test-utils';
```

**Nota:** usa `nuqs/adapters/react` (no el adaptador Next.js) para compatibilidad con jsdom.

### Factories — `shared/test-utils/factories.ts`

Producen entidades de dominio válidas con valores por defecto sensatos. Usar en lugar de construir objetos literales en cada test — evita que los tests se rompan cuando cambia un tipo. IDs únicos garantizados por `crypto.randomUUID()`.

| Nombre | Firma | Descripción |
|---|---|---|
| `createOrder` | `(overrides?: Partial<Order>) => Order` | Default: estado `ENVIADO`, incluye 1 item |
| `createUser` | `(overrides?: Partial<User>) => User` | Default: `role: "client"` |
| `createStore` | `(overrides?: Partial<Store>) => Store` | Default: `status: "open"`, `kind: "food-truck"`, coordenadas CABA |
| `createOrderItem` | `(overrides?: Partial<OrderItem>) => OrderItem` | Default: `quantity: 1`, incluye snapshot de producto |

Ejemplo:
```ts
const order = createOrder({ status: ORDER_STATUS.ACEPTADO });
const store = createStore({ kind: STORE_KIND.foodTruck, status: STORE_STATUS.open });
const item = createOrderItem({ productName: "Pizza" });
```

---

### Invariant tests — `shared/test-utils/no-raw-img.test.ts`

Architectural fitness function: scans all `.tsx`/`.jsx` files and fails if any raw `<img>` tag is found. Enforces that all images go through `next/image`.

| Nombre | Tipo | Descripción |
|---|---|---|
| `Image optimization invariant` | fitness-fn test | Prohíbe `<img` nativo en componentes; solo `next/image` permitido |

No importar ni reutilizar — es un test standalone que corre con el suite normal.

---

## §15 — pgTAP RLS tests

Viven en `supabase/tests/`. Corren dentro de una transacción `BEGIN/ROLLBACK` — no dejan datos en la DB. Correr con `pnpm supabase:test:rls`.

| Archivo | Tabla | Tests | Qué cubre |
|---|---|---|---|
| `rls_users.sql` | `public.users` | 8 | SELECT/UPDATE propio, isolation entre usuarios, INSERT denegado |
| `rls_stores.sql` | `public.stores` | 8 | Visibilidad por `available`, UPDATE propio, cross-store isolation |
| `rls_products.sql` | `public.products` | 8 | Visibilidad por `available`, INSERT solo owner, cross-store isolation |
| `rls_orders.sql` | `public.orders` + `orders_for_tienda` | 11 | Customer/tienda SELECT isolation, INSERT propio, PRD §7.2 location privacy |
| `rls_audit_log.sql` | `public.audit_log` | 5 | Solo admin lee, INSERT denegado para authenticated |
| `rate_limit.sql` | `public.rate_limit_buckets` + `check_rate_limit` | 11 | Token bucket: burst allowed, blocked over capacity, refill después del window, cleanup TTL, RLS deny-all anon/authenticated, params inválidos throws (B13-A) |

### Patrón de simulación de usuario autenticado

```sql
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<auth_user_id_uuid>')::text, true);
-- ... assertions ...
reset role;
```

`SET LOCAL ROLE authenticated` activa la evaluación de RLS policies. `set_config('request.jwt.claims', ...)` hace que `auth.uid()` devuelva el UUID indicado. `RESET ROLE` vuelve al superusuario `postgres` para setup/verificación post-UPDATE.

### Patrón cross-user ID (para throws_ok con IDs ocultos por RLS)

Cuando el test necesita el bigint ID de otro usuario (oculto por RLS desde el rol que se va a simular), stashear como superusuario antes del `set local role`:

```sql
select set_config('test.other_user_id',
  (select id::text from public.users where auth_user_id = '<uuid>'), true);
-- luego en el SQL de throws_ok:
-- current_setting('test.other_user_id')::bigint
```

### throws_ok — forma correcta con solo SQLSTATE

```sql
-- 4-arg form: throws_ok(sql, errcode, errmsg, description)
-- Pasar null como errmsg para no verificar el mensaje, solo el code
select throws_ok($$ ... $$, '42501', null, 'descripción del test');
```

---

### RLS Benchmark — `scripts/rls-benchmark.sql`

SQL script that generates production-scale synthetic data and asserts the 5 most critical domain queries complete within a 20 ms threshold with RLS fully enforced.

| Query | Index used | Actor |
|---|---|---|
| Q1 — available stores (map) | `stores_current_location_active_gist_idx` | customer |
| Q2 — customer order history | `orders_customer_created_idx` | customer |
| Q3 — store active inbox | `orders_store_status_created_idx` | tienda |
| Q4 — store product catalog | `products_store_available_idx` | tienda |
| Q5 — order items for one order | `order_items_order_id_idx` + EXISTS RLS | customer |

**Synthetic data:** 1k users · 10k stores · 50k products · 100k orders · 100k order_items. Data is tagged with `__bench_user_*` / `__bench_store_*` / `__bench_product_*` prefixes and cleaned up automatically on success and failure.

**Auth simulation:** uses `set_config('request.jwt.claims', ...)` + `SET LOCAL ROLE authenticated` — no real auth.users entries needed.

**Run:** `psql "$DATABASE_URL" -f scripts/rls-benchmark.sql`

**CI:** `rls-benchmark` job in `.github/workflows/ci.yml` (`continue-on-error: true` until baseline is established).

---

---

## §16 — E2E Playwright specs

Viven en `e2e/`. Corren contra el dev server (puerto 3100). CI usa `workers: 1`.

| Archivo | Qué verifica |
|---|---|
| `e2e/realtime.spec.ts` | Propagación de aceptación de pedido <5s (store-demo-1); toggle de disponibilidad <2s (B6.3) |
| `e2e/realtime-propagation.spec.ts` | SLA PRD §7.2: aceptación de pedido propagada al cliente en <5s (store-demo-2, seed B6.4 "Taco E2E B6.4") + timing assertion explícito con `Date.now()` |
| `e2e/push-delivery.spec.ts` | Loop completo del push (B8.4): subscribe → submit RECIBIDO → store accept → captura del payload del push en mock. Crea órdenes únicas por test run via `POST /api/__e2e/order`, capturadas via `/api/__e2e/push-capture` |

Las specs usan `makeSessionCookie(role, userId)` + `context.addCookies()` con `SESSION_COOKIE_NAME` para autenticar sin UI. `realtime-propagation.spec.ts` usa `store-demo-2` para evitar conflictos de estado con `realtime.spec.ts` (que consume el order RECIBIDO de `store-demo-1`). `push-delivery.spec.ts` evita conflictos creando una orden con `productId` único por timestamp y localizándola por su `id` truncado en DOM (no comparte seeds con las otras dos specs).

### Test-only push capture infrastructure (B8.4)

Para validar el dispatcher de push end-to-end sin un VAPID server real, el repo expone (gated por `process.env.E2E_TEST_MODE === "1"`):

| Archivo | Rol |
|---|---|
| `shared/services/push.test-capture.ts` | Singleton in-memory: `subscribeUser/unsubscribeUser/listCapturedPushes/clearCaptureStore` + factory `createTestCapturePushSender()` que implementa `ServerPushSender` capturando solo si el user está suscrito |
| `shared/domain/events/wiring.e2e.ts` | `registerE2EPushListener()` — wirea el `push-on-status-change` listener al `eventBus` con el sender de captura + `storeRepository` mock. Idempotente (segunda llamada devuelve el mismo unregister fn) |
| `app/api/__e2e/push-capture/route.ts` | `GET ?userId=` lista capturas; `POST {action, userId}` subscribe/unsubscribe; `DELETE` clear. 404 si `E2E_TEST_MODE` ≠ `"1"` |
| `app/api/__e2e/order/route.ts` | `POST` crea orden directa en estado `RECIBIDO` (bypass del state machine). 404 si `E2E_TEST_MODE` ≠ `"1"` |
| `instrumentation.ts` | En boot del runtime nodejs, si `isE2ETestMode()` invoca `registerE2EPushListener()` |
| `playwright.config.ts` (`webServer.env.E2E_TEST_MODE = "1"`) | Activa la cadena entera durante runs de Playwright |

---

## §17 — Cron concurrent tests

Viven junto a cada Route Handler de cron (`app/api/cron/<job>/route.concurrent.test.ts`) y validan el contrato de `for update skip locked` bajo contención real disparando 5 invocaciones paralelas de `POST` contra el mismo lote de filas. Los unit tests vecinos (`route.test.ts`) cubren la lógica del handler con mocks; estos files cubren el comportamiento que sólo se manifiesta contra Postgres real.

| Archivo | Job | Qué verifica |
|---|---|---|
| `app/api/cron/expire-orders/route.concurrent.test.ts` | expire-orders | 5 workers paralelos sobre N órdenes `enviado` con `created_at < now() - 10min`: cada una transiciona a `expirado` exactamente una vez, throughput < 20s, sin deadlocks |
| `app/api/cron/auto-close-orders/route.concurrent.test.ts` | auto-close-orders | 5 workers paralelos sobre N órdenes `aceptado` con `updated_at < now() - 2h`: cada una transiciona a `finalizado` exactamente una vez, throughput < 20s, sin deadlocks |

**Pre-requisito:** Supabase local corriendo (`pnpm supabase:start`). Si no es alcanzable, los tests se skipean silenciosamente vía `describe.skipIf` (top-level await sobre `isLocalSupabaseReachable`).

**Diseño de aislamiento:** cada archivo crea su propio `users` + `stores` con marker `concurrent-test-<uuid>` en `beforeAll`, siembra N órdenes en `beforeEach` y limpia en `afterEach`. Las aserciones filtran por `store_id` para tolerar otras órdenes preexistentes en la DB local compartida (ej. de fixtures de seed o de otro file en paralelo).

**Mocks deliberados:** sólo `createServiceRoleClient` (bypass del check `https://`), `SupabaseAuditLogService` (para no contaminar `audit_log`), `eventBus.publish` (para capturar eventos publicados), `env` y `logger`. El RPC `claim_*` y la transición real corren contra Postgres.

### Helper compartido — `app/api/cron/_test-helpers/concurrent-fixtures.ts`

| Nombre | Firma | Descripción |
|---|---|---|
| `LOCAL_SUPABASE_URL` / `LOCAL_SERVICE_ROLE_KEY` | constant | URL + JWT well-known del CLI de Supabase local. Safe to commit (sólo válidos contra `supabase start`) |
| `createLocalServiceRoleClient` | `() => SupabaseClient` | Crea un client `@supabase/supabase-js` apuntando a localhost con service-role |
| `isLocalSupabaseReachable` | `() => Promise<boolean>` | Ping con timeout 1.5s a `/rest/v1/` (PostgREST root es más estable que `/auth/v1/health` post-restart) |
| `seedIdentity` | `(client) => Promise<{ userId, storeId, testRunId }>` | Crea un user + store con marker UUID; usar en `beforeAll` |
| `seedOrders` | `({ client, identity, count, status, createdAt, updatedAt? }) => Promise<{ publicIds, internalIds }>` | Inserta N órdenes con timestamps en el pasado. `updatedAt` opcional para simular `accepted_at` viejo (sólo aplica a `status='aceptado'`) |
| `cleanupIdentity` | `(client, identity) => Promise<void>` | Borra audit_log + orders + store + user del run. Usar en `afterAll` |
| `readOrderStatuses` | `(client, internalIds) => Promise<readonly string[]>` | Lee `status` de los IDs sembrados — para asertar el estado post-claim |

**No es un test** — vive en una carpeta `_test-helpers/` (Next.js trata `_*` como private; no se rutea).

### Bug histórico capturado por estos tests

Durante la implementación de B7-A, el integration test reveló que `auto-close-orders/route.ts` validaba la respuesta del RPC con `z.string().datetime()` (sólo acepta sufijo `Z`), pero PostgREST serializa `timestamptz` con offset numérico (`+00:00`). Los unit tests usaban `Date.toISOString()` que produce `Z` → never broke. Fix: `.datetime({ offset: true })`.

---

## §18 — Security smoke tests (B13-A)

Viven en `e2e/security/` y corren con un Playwright config separado (`playwright.security.config.ts` — port 3110) para no contaminar la suite E2E principal. Comando: `pnpm test:e2e:security`. Requieren Supabase local corriendo y env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (los tests RLS skipean en su ausencia).

| Archivo | Qué verifica |
|---|---|
| `e2e/security/rate-limit-flood.spec.ts` | Burst de 80 req a `/api/*` produce ≥1 respuesta 429 con headers `Retry-After`, `X-RateLimit-{Limit,Remaining,Reset}`. Body no leakea stack/env names |
| `e2e/security/server-action-fuzz.spec.ts` | 10 payloads malformados en `/api/push/{subscribe,unsubscribe}` y `/api/cron/expire-orders` retornan 4xx (no 5xx), body no leakea `CRON_SECRET` ni `SUPABASE_SERVICE_ROLE_KEY` |
| `e2e/security/rls-anon-restricted.spec.ts` | Anon role contra PostgREST `/rest/v1/<tabla>` para 5 tablas restringidas (`orders`, `order_items`, `audit_log`, `push_subscriptions`, `rate_limit_buckets`) — SELECT devuelve `[]` o error, INSERT siempre falla |

**Filosofía:** estos no atrapan bugs (eso es trabajo de unit/integration/pgTAP). Son alarmas para regresiones de configuración: alguien sacó RLS, alguien removió rate limit del middleware, alguien expuso un secret. Pocos, rápidos, fallos claros. Job dedicado en CI: `security-smoke` en `.github/workflows/ci.yml`.

---

## §19 — Seed data

El seed vive en `supabase/seed.sql` y se aplica automáticamente al final de `pnpm supabase:reset` (después de correr todas las migraciones). Es idempotente — usa `ON CONFLICT DO NOTHING` con UUIDs fijos para que multiple ejecuciones no dupliquen datos.

**Guía completa:** [`docs/workflows/dev-seed.md`](../../docs/workflows/dev-seed.md) — accounts, tiendas, productos, pedidos, coordenadas y UUIDs fijos.

### Cómo aplicar

```bash
# Reset completo (migraciones + seed)
pnpm supabase:reset

# Solo el seed (sin resetear schema)
npx supabase db query --file supabase/seed.sql
```

### Cuentas de desarrollo

| Rol     | Email                           | Contraseña      | UUID auth                              |
|---------|---------------------------------|-----------------|----------------------------------------|
| cliente | `cliente@dev.ambulante.local`   | `Ambulante123!` | `00000000-0000-0000-0000-000000000001` |
| tienda  | `tienda@dev.ambulante.local`    | `Ambulante123!` | `00000000-0000-0000-0000-000000000002` |
| admin   | `admin@dev.ambulante.local`     | `Ambulante123!` | `00000000-0000-0000-0000-000000000003` |

### Datos disponibles

| Entidad  | Cantidad | Detalle |
|----------|----------|---------|
| Usuarios | 3        | cliente, tienda, admin |
| Tiendas  | 5        | Palermo, San Telmo, Recoleta, Villa Crespo, Caballito |
| Productos| 20       | 4 por tienda |
| Pedidos  | 10       | Todos los estados del ciclo de vida representados |

Los 10 pedidos cubren: `enviado`, `recibido`, `aceptado` (×2), `en_camino`, `finalizado` (×2), `rechazado`, `cancelado`, `expirado`.

### Notas para tests de integración

- Los **UUIDs fijos** permiten referenciar entidades en tests sin un lookup previo. Ver `docs/workflows/dev-seed.md` para la tabla completa.
- El seed respeta **§7.2 del PRD**: `customer_location` es `NULL` para pedidos en estado `enviado` y `recibido`.
- El seed respeta **§7.4 del PRD**: `order_items` incluye el campo `product_snapshot` jsonb.
- Los tests pgTAP (`supabase/tests/`) no dependen del seed — crean y limpian su propia data en transacciones `BEGIN/ROLLBACK`. Los tests de integración que sí dependen del seed deben documentar esa dependencia explícitamente.

---

## Convenciones de tests en este repo

- **Framework:** Vitest + `@testing-library/react`
- **Cobertura mínima:** 80% para archivos nuevos
- **Aislamiento:** cada test limpia su QueryClient — no compartir state entre tests
- **Mocks de services:** usar `createMockRealtimeService` / `createMockPushService` de `shared/services/` (§4 de data.md), no mockear módulos completos con `vi.mock` salvo que no haya alternativa
- **No mockear la base de datos:** los repositorios usan services mock — testear contra los services, no contra Supabase/fetch real
- **Setup global:** `afterEach(cleanup)` registrado en el setup file de vitest
