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

## Convenciones de tests en este repo

- **Framework:** Vitest + `@testing-library/react`
- **Cobertura mínima:** 80% para archivos nuevos
- **Aislamiento:** cada test limpia su QueryClient — no compartir state entre tests
- **Mocks de services:** usar `createMockRealtimeService` / `createMockPushService` de `shared/services/` (§4 de data.md), no mockear módulos completos con `vi.mock` salvo que no haya alternativa
- **No mockear la base de datos:** los repositorios usan services mock — testear contra los services, no contra Supabase/fetch real
- **Setup global:** `afterEach(cleanup)` registrado en el setup file de vitest
