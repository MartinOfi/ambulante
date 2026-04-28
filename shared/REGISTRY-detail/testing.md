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

## Convenciones de tests en este repo

- **Framework:** Vitest + `@testing-library/react`
- **Cobertura mínima:** 80% para archivos nuevos
- **Aislamiento:** cada test limpia su QueryClient — no compartir state entre tests
- **Mocks de services:** usar `createMockRealtimeService` / `createMockPushService` de `shared/services/` (§4 de data.md), no mockear módulos completos con `vi.mock` salvo que no haya alternativa
- **No mockear la base de datos:** los repositorios usan services mock — testear contra los services, no contra Supabase/fetch real
- **Setup global:** `afterEach(cleanup)` registrado en el setup file de vitest
