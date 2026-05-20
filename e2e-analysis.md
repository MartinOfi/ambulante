# Análisis de fallas E2E

> Generado: 2026-05-17 | Suite: 155 tests, ~79 errores

---

## TL;DR de timeouts

Los timeouts **no son solo errores en el código de los tests** — hay tres problemas sistémicos en la capa de infraestructura de Playwright que los causan o agravan.

---

## Deep-dive: Por qué los timeouts van más allá del test code

### Problema 1 — `waitForLoadState("networkidle")` en una app con red perpetuamente activa

`networkidle` significa "500ms sin ninguna request en vuelo". Esta app tiene tres fuentes de ruido de red que nunca paran:

| Fuente | Comportamiento |
|---|---|
| **MapLibre GL JS** | Fetches tiles vectoriales continuamente mientras el mapa está visible |
| **Supabase Realtime** | WebSocket abierto con heartbeats periódicos (~25s) |
| **React Query background refetch** | Queries con `staleTime` corto refetchean automáticamente |

Cualquier página que cargue alguno de estos nunca llega a networkidle. El test espera 30s, falla, y Playwright destruye el contexto.

**Sitios de llamada afectados** (todos llaman `waitForLoadState("networkidle")`):

| Archivo | Línea | Ruta |
|---|---|---|
| `e2e/dark-mode.spec.ts` → `visitInDark()` | ~22 | `/`, `/login`, `/register`, `/map` |
| `e2e/use-cases/page-objects/StoreDashboardPage.ts` | 8 | `/store/dashboard` |
| `e2e/use-cases/page-objects/StoreDashboardPage.ts` (StoreAnalyticsPage) | 81 | `/store/analytics` |
| `e2e/use-cases/page-objects/CatalogPage.ts` | 8, 13 | `/store/catalog`, `/store/catalog/new` |
| `e2e/keyboard-navigation.spec.ts` | — | `/map` (el peor caso) |

---

### Problema 2 — `dark-mode.spec.ts` crea contextos SIN heredar auth state

```typescript
// dark-mode.spec.ts (simplificado)
async function createDarkContext(page: Page): Promise<BrowserContext> {
  const browser = page.context().browser();
  return browser.newContext({ colorScheme: "dark" }); // ← sin storageState
}
```

El fixture `page` en el proyecto `[as-client]` tiene las cookies de auth inyectadas vía `storageState: 'e2e/.auth/client.json'`. Pero `browser.newContext()` arranca **completamente en blanco**: sin cookies, sin localStorage, sin service worker. Si algún test visita una ruta protegida, el middleware la redirectea a `/login` indefinidamente hasta el timeout.

Además, incluso en rutas públicas (`/`, `/login`), el Supabase browser client hace un request al arrancar para verificar si hay sesión activa — eso mantiene el network activo y bloquea networkidle.

La consecuencia es el error secundario visible en los logs:

```
browserContext.close: Target page, context or browser has been closed
```

Este error **no es la causa raíz** — es el síntoma de que el test ya había fallado por timeout y Playwright destruyó el contexto antes de que el `finally { await darkContext.close() }` corriera.

---

### Problema 3 — Stale auth tokens a lo largo de la suite

`global-setup.ts` crea los archivos `e2e/.auth/{client,store,admin}.json` **una sola vez** al inicio. Los tokens JWT de Supabase expiran en **60 minutos** (TTL default).

El middleware usa `supabase.auth.getUser()` — validación server-side estricta:

```typescript
// middleware.ts:115
const { data: { user }, error } = await supabase.auth.getUser();
```

`getUser()` verifica el JWT contra Supabase en cada request. Si el token expiró, devuelve `user: null` → redirect a `/login`. No hay refresh automático en middleware (correcto desde seguridad, pero implica que si la suite demora más de 60 min, todos los contextos que carguen los `.json` files van a fallar su primer request autenticado).

El efecto concreto: `loginAsClientFresh(page)` navega a `/map` → middleware redirecta a `/login` → `waitForURL("**/map**")` falla por timeout a los 15s.

---

### Problema 4 — Rate limiter puede bloquear `/api/*` sin IP (a verificar)

El middleware aplica rate limiting a `/api/*`. La lógica de extracción de IP:

```typescript
function extractIp(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim(); // ← Vercel-only
  const forwarded = request.headers.get("x-forwarded-for"); // ← solo proxies
  ...
}
// Si no hay IP:
return NextResponse.json({ error: "No se pudo..." }, { status: 400 });
```

En local dev, `x-real-ip` lo setea Vercel (no disponible localmente). `x-forwarded-for` lo setean proxies/load balancers. Los requests de Playwright (`page.request.post(...)`) van directamente al servidor local sin pasar por ninguno de los dos.

Si `createRateLimiterFromEnv()` no retorna un no-op en modo E2E, **todos los calls a `/api/cron/*` devuelven 400** antes de llegar al route handler — incluso antes del E2E bypass de `CRON_SECRET`.

---

## Grupos de errores por root cause

### GRUPO A — Reemplazar `networkidle` (~30 tests, mayor retorno por esfuerzo)

**Fix compartido:** en todos los sitios listados arriba, cambiar a `waitForLoadState("domcontentloaded")` o `waitForURL(...)` según el caso.

Tests que se desbloquean al hacer el fix:
- Todos los tests de dark mode (errors 50–68, 74)
- Tests de keyboard navigation en `/map`
- Tests de StoreDashboard (UC-STO-07 toggle, UC-STO-08 link pedidos, UC-STO-09 catálogo)
- Tests de catalog (UC-STO-11 al 16)
- Tests de store analytics (UC-STO-24)

El error `browserContext.close: Target page, context or browser has been closed` desaparece solo — no hay que tocar el patrón `try/finally`.

---

### GRUPO B — Accesible name en español vs. inglés (6–8 tests)

`global-setup.ts` (que funciona) usa:

```typescript
getByLabel(/correo electrónico/i) // ✅ UI en español
```

Los tests de auth usan:

```typescript
getByRole('textbox', { name: /email/i }) // ❌ no matchea "Correo electrónico"
```

**Fix compartido:** en `auth.spec.ts` y `auth.uc.spec.ts`, reemplazar `getByRole('textbox', { name: /email/i })` con `getByLabel(/correo electrónico/i)`.

---

### GRUPO C — Toggle `disabled` porque `useCurrentStoreQuery` está pendiente

`StoreDashboard.container.tsx:24`:

```typescript
toggleDisabled={storeId === null || storeQuery.isPending}
```

Si el test interactúa con el toggle antes de que React Query resuelva la query del store, el switch tiene `disabled` y `toBeEnabled()` falla.

Este grupo es **secundario de GRUPO A**: si `StoreDashboardPage.goto()` esperaba networkidle (y fallaba), el test ni llegaba a la assertion. Al corregir networkidle con `domcontentloaded`, la navegación termina rápido pero los datos pueden no estar aún.

**Fix adicional necesario en el POM:** después de la navegación, esperar que el toggle sea interactuable antes de que el test body lo toque. El test ya tiene `toBeEnabled({ timeout: 8_000 })`, que debería alcanzar una vez que la navegación no esté trancada.

---

### GRUPO D — `CRON_SECRET` / `auto-close-orders` sin bypass E2E (2 tests)

`expire-orders/route.ts` tiene el bypass correcto:

```typescript
const isE2E = env.E2E_TEST_MODE === "1";
if (!isE2E) {
  // verifica CRON_SECRET
}
```

Pero el test de `auto-close-orders` llama:

```typescript
const response = await clientPage.request.post("/api/cron/auto-close-orders");
expect(response.ok()).toBe(true); // ← falla
```

El route handler de `auto-close-orders` probablemente no tiene ese mismo bypass, y sin `CRON_SECRET` en env devuelve 503.

**Fix compartido:**
1. Verificar que `E2E_TEST_MODE=1` esté en las env vars del playwright config.
2. Agregar el mismo bypass `isE2E` en `auto-close-orders/route.ts`.
3. Verificar que el rate limiter sea no-op en E2E mode (ver Problema 4 arriba).

---

### GRUPO E — Tests multi-contexto: `firstOrderCard` nunca aparece (UC-STO-18/19/20)

Estos tests crean dos contextos independientes (cliente + tienda) y verifican transiciones vía Realtime. Dos sub-causas posibles:

**E1 — Race en la suscripción Realtime:**

El flujo es:
1. Cliente crea orden (`clientPage`)
2. Tienda navega a `/store/orders` (`storePage`)
3. Test espera `firstOrderCard` con `REALTIME_TRANSITION_TIMEOUT_MS`

Si la suscripción Realtime del `storePage` se establece *después* de que la orden fue insertada, el evento ya se perdió. Supabase Realtime usa `LISTEN` sobre Postgres — solo captura eventos posteriores a la suscripción.

**E2 — Approved store no aparece en el mapa:**

`submitOrderAndLand` depende de que `E2E_STORES.approved` aparezca en el mapa. Para eso, la tienda debe tener `available = true` y coordenadas en `current_location` dentro del radio del RPC `find_stores_nearby`. Si el seed no setea la ubicación, el mapa queda vacío y el flow de creación de pedido nunca arranca.

---

### GRUPO F — Admin pages sin datos o sin implementar (20+ tests)

Todos los tests de admin (`UC-ADM-*`) timeout esperando headings, tablas, sidebars. Sin leer los componentes de admin, el diagnóstico probable es uno de:

- Las páginas todavía no están implementadas (hay un placeholder)
- Los locators del POM no coinciden con la estructura real del DOM
- RLS policies bloquean al usuario admin de test en Supabase

Estos 20+ tests comparten la misma causa estructural — se pueden investigar y corregir en un solo batch.

---

### GRUPO G — Contraste de color (1 test, UC-A11Y)

`text-zinc-400` en fondo blanco: ratio 2.56, mínimo requerido 4.5:1 (WCAG AA).

El elemento es:

```html
<p class="text-xs-tight font-medium tracking-tag uppercase text-zinc-400">
  Tu mercado en movimiento
</p>
```

**Fix independiente:** cambiar a `text-zinc-500` o `text-zinc-600`.

---

## Resumen ejecutivo

| Grupo | Tests desbloqueados | Archivos a tocar | Complejidad |
|---|---|---|---|
| **A** — Reemplazar `networkidle` | ~30 | ~5 POMs + 2 specs | Baja (búsqueda global + reemplazo) |
| **B** — Locator email en español | 6–8 | 2 specs | Baja |
| **C** — Toggle disabled | ~5 | POM (secundario de A) | Baja |
| **D** — Cron routes E2E bypass | 2–3 | 1 route handler + env | Media |
| **E** — Multi-contexto Realtime | 3–5 | Seed + suscripción | Alta |
| **F** — Admin pages | 20+ | Componentes admin | Alta |
| **G** — Contraste de color | 1 | 1 clase CSS | Trivial |

**Orden recomendado:** A → B → G → D → C → E → F

Grupo A es el de mayor retorno por esfuerzo: una búsqueda global de `waitForLoadState("networkidle")` en `/e2e` y su reemplazo resuelve más de la mitad de todos los errores de la suite.
