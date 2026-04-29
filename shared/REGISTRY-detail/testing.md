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

## Convenciones de tests en este repo

- **Framework:** Vitest + `@testing-library/react`
- **Cobertura mínima:** 80% para archivos nuevos
- **Aislamiento:** cada test limpia su QueryClient — no compartir state entre tests
- **Mocks de services:** usar `createMockRealtimeService` / `createMockPushService` de `shared/services/` (§4 de data.md), no mockear módulos completos con `vi.mock` salvo que no haya alternativa
- **No mockear la base de datos:** los repositorios usan services mock — testear contra los services, no contra Supabase/fetch real
- **Setup global:** `afterEach(cleanup)` registrado en el setup file de vitest
