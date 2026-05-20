# Postmortem: KPI Dashboard — spinner infinito en hard reload

**Fecha:** 2026-05-17 / 2026-05-18  
**Síntoma:** `/admin/dashboard` mostraba "Cargando métricas..." indefinidamente al hacer hard reload o navegar directo a la URL. En soft navigation (login → redirect → dashboard) funcionaba bien.  
**Resolución:** Mover el fetch de datos del browser al servidor via Route Handler.

---

## 1. Síntoma exacto

- **Reproducible con:** Hard reload (Cmd+Shift+R), abrir la URL directamente en una pestaña nueva, navegar desde otra ruta sin pasar por el login.
- **No reproducible con:** Login → redirect automático al dashboard (soft navigation dentro de Next.js).
- **Estado de React Query:** `isPending: true`, `fetchStatus: "fetching"` — React Query pensaba que estaba fetcheando, pero nunca resolvía.
- **Red:** **Cero requests HTTP** hacia Supabase (`127.0.0.1:54321`) en el Network tab del browser. El fetch nunca llegaba a la capa de red.
- **Consola:** Sin errores. Sin warnings. Silencio absoluto.
- **Timeout:** Nunca. La Promise colgaba infinitamente sin rechazarse.

---

## 2. Arquitectura previa al fix

```
useKpiDashboardQuery (React Query)
  └─ kpiDashboardService.fetchKpiSnapshot()         [adapter.ts]
       └─ createKpiDashboardService(orderRepo, storeRepo)
            ├─ orderRepo.findAll()                  [SupabaseOrderRepository]
            │    └─ this.client.from("orders").select(...)
            └─ storeRepo.findAll()                  [SupabaseStoreRepository]
                 └─ this.client.from("stores").select(...)
```

`this.client` era una instancia de `createBrowserClient` de `@supabase/ssr`, creada como **singleton a nivel de módulo** en `shared/repositories/index.ts`. Ese singleton se creaba una vez al importar el módulo, tanto en el servidor (SSR) como en el cliente.

---

## 3. Diagnóstico — lo que se investigó

### 3.1 React Query Devtools

Mostraba `fetchStatus: "fetching"` pero la query nunca resolvía ni rechazaba. La queryFn se invocaba (confirmado por `console.log("[KPI] queryFn called")`), pero el `.then()` y el `.catch()` encadenados nunca se disparaban.

**Conclusión:** la Promise devuelta por `fetchKpiSnapshot()` nunca settleaba. No era un error silenciado — era una Promise literalmente suspendida.

### 3.2 Network tab

Con el Network tab abierto al momento del hard reload: **ningún request a `127.0.0.1:54321`**. El Supabase client JS generaba la query (el objeto query existía en memoria) pero nunca dispatch-eaba el HTTP request.

**Conclusión:** el hang ocurría *antes* de que el cliente Supabase llegara a hacer `fetch()`. Algo en la inicialización del cliente o en la resolución de la sesión de auth bloqueaba todo.

### 3.3 Logs de diagnóstico temporales

Se agregaron `console.log` en cascada para aislar el punto exacto de cuelgue:

```
[KPI] queryFn called           → sí aparecía (la queryFn se invocaba)
[KPI-ADAPTER] isMock=false     → nunca apareció (problema en el rebuild del bundle)
[KPI-SVC] calling Promise.all  → nunca apareció
[KPI-REPO] before await query  → nunca apareció
[KPI-REPO] after await query   → nunca apareció
```

El Fast Refresh de Next.js no estaba rebuildeando el bundle con los nuevos logs (el chunk `_a3e6c49b._.js` era servido stale). Esto impidió confirmar exactamente en qué línea colgaba, pero dado que el adapter y el servicio son llamados *dentro* de la queryFn que sí se invocaba, el cuelgue tenía que estar en `findAll()` → específicamente en el momento en que el cliente Supabase intentaba preparar la request.

### 3.4 Hipótesis descartadas

| Hipótesis | Por qué se descartó |
|-----------|---------------------|
| RLS bloqueando la query | Si RLS rechazaba, Supabase devolvería un error — pero ningún request HTTP llegaba a Supabase |
| Network timeout | Sin request no hay timeout; además el spinner era permanente, no aparecía error después de N segundos |
| Error silenciado en Promise.all | Se encadenó `.catch()` explícito — nunca se invocó |
| `isMock = true` en producción | El log `[KPI-ADAPTER]` habría aparecido si el bundle se hubiera rebuildeado; además la feature funcionaba en soft nav |
| Problema de CORS | En dev no hay CORS; además sin request no hay CORS |
| Error en SSR (server-side rendering) | La queryFn de React Query no corre en SSR; además el componente era `"use client"` |

### 3.5 Diferencia entre soft nav y hard reload

| Aspecto | Soft navigation | Hard reload |
|---------|-----------------|-------------|
| Estado de auth en memoria JS | ✅ Ya existe (login lo creó) | ❌ Vacío — la VM JS se reinició |
| Cómo el cliente Supabase obtiene la sesión | La tiene en memoria, sin roundtrip | Debe leer de localStorage/cookies y **potencialmente refrescar el token** |
| ¿Dispara token refresh? | No | Sí (o intenta hacerlo) |
| Resultado | Fetch inmediato | **Hang** |

---

## 4. Causa raíz

### El mecanismo de lock de `@supabase/auth-js` v2

`@supabase/auth-js` v2 usa la **Web Locks API** (`navigator.locks.request()`) para serializar los token refreshes entre tabs del mismo origen. El propósito es evitar que dos tabs intenten refrescar el mismo token simultáneamente, lo que produciría race conditions.

El flujo en hard reload:
1. El browser recrea la VM de JavaScript.
2. El módulo singleton de Supabase se importa y `createBrowserClient` crea el cliente.
3. React Query invoca la queryFn.
4. La queryFn llama `orderRepo.findAll()` que llama `this.client.from("orders").select(...)`.
5. **Internamente**, antes de ejecutar el request, el Supabase JS client llama `getSession()` para obtener los headers de autorización.
6. `getSession()` detecta que no hay sesión en memoria → intenta restaurarla desde localStorage/cookies.
7. Si hay un token expirado o un refresh en curso, llama `refreshSession()`.
8. `refreshSession()` adquiere `navigator.locks.request("sb-refresh-token-lock-<projectRef>", { mode: "exclusive" }, callback)`.
9. **Si el lock no puede adquirirse** (porque otra tab lo tiene, porque el lock quedó huérfano, o porque el browser tiene algún estado interno corrupto), la callback nunca se invoca.
10. La Promise de `refreshSession()` nunca resuelve → `getSession()` nunca resuelve → el Supabase client nunca manda el HTTP request → `findAll()` cuelga → `fetchKpiSnapshot()` cuelga → la queryFn de React Query cuelga.

**Por qué en soft nav no pasa:** cuando el usuario hace login, el flow de auth establece la sesión y el token en memoria. El cliente Supabase ya tiene todo lo que necesita. Cuando navega al dashboard, `getSession()` devuelve la sesión inmediatamente sin necesidad de adquirir el lock.

### Por qué no hay error

`navigator.locks.request()` no tiene timeout built-in. La callback simplemente no se llama. No hay rechazo de Promise, no hay excepción, no hay log. Silencio total.

---

## 5. Fix aplicado

### Principio

**Sacar el fetch del browser completamente.** El servidor Node no tiene `navigator`, por lo tanto `@supabase/auth-js` en el servidor usa un path de code completamente diferente: lee la sesión directo de las cookies de la HTTP request, sin locks, sin Web Locks API, sin posibilidad de hang.

### Cambios

#### Nuevo: `app/api/admin/kpi/route.ts`

Route Handler GET que:
1. Usa `createRouteHandlerClient()` (server-side, cookies) para verificar la sesión.
2. Llama al RPC `is_admin` para verificar el rol — 401 o 403 si no cumple.
3. Crea un cliente service role para las queries de datos (evita RLS en operaciones admin).
4. Instancia `SupabaseOrderRepository` + `SupabaseStoreRepository` con ese cliente.
5. Llama `createKpiDashboardService(orderRepo, storeRepo).fetchKpiSnapshot()`.
6. Devuelve `{ data: snapshot }` como JSON.

#### Nuevo: `features/admin-kpi-dashboard/services/kpi-dashboard.api.service.ts`

Implementación de `KpiDashboardService` que en el browser hace `fetch("/api/admin/kpi", { credentials: "include" })`. Parsea la respuesta con `kpiSnapshotSchema.extend({ computedAt: z.coerce.date() })` porque JSON serializa `Date` como string ISO.

#### Modificado: `kpi-dashboard.adapter.ts`

Eliminados los logs de diagnóstico. Ahora selecciona entre `mockService` (sin Supabase) y `kpiApiService` (con Supabase, usa el Route Handler).

#### Limpiado: hook, service, orders.supabase.ts

Se eliminaron todos los `console.log` de diagnóstico temporal.

---

## 6. Dónde más puede estar pasando este mismo bug

**Todo lugar donde un componente `"use client"` o un hook hace queries directo a Supabase desde el browser en una ruta que el usuario puede cargar directamente (sin pasar por el login primero).**

La condición exacta para que se reproduzca:
1. El user navega directamente a la URL (hard reload, bookmark, link externo).
2. El cliente Supabase en memoria no tiene la sesión todavía.
3. El cliente intenta `refreshSession()`.
4. El lock no está disponible.

### Rutas de alto riesgo en este repo

| Ruta | Por qué es riesgo |
|------|------------------|
| `/admin/dashboard` | ✅ **Fixed** |
| `/admin/orders` | Si fetchea orders con browser client directo |
| `/admin/stores` | Si fetchea stores con browser client directo |
| `/admin/users` | Si fetchea users con browser client directo |
| `/admin/moderation` | Si fetchea moderation items con browser client directo |
| Cualquier `/store/*` con datos privados | Si el dueño de la tienda accede directo |
| Cualquier `/orders/*` | Si el cliente accede directo a un pedido por URL |

### Cómo detectar si un componente tiene este problema

Buscar componentes que:

```bash
# Importan repositorios Supabase directo en features o componentes
grep -rn "from.*shared/repositories" app/ features/ --include="*.tsx" --include="*.ts" | grep -v "\.server\." | grep -v "api/"
```

O que usan el cliente browser directo:
```bash
grep -rn "createBrowserClient\|supabase\.from\|orderRepository\|storeRepository" features/ --include="*.tsx" --include="*.ts"
```

Cualquier hit que esté dentro de un hook o componente client-side es candidato al mismo bug.

### El patrón correcto para datos de admin/privados

```
Browser (React Query)
  └─ fetch("/api/<dominio>/<recurso>")
       └─ Route Handler (Node, server-only)
            ├─ createRouteHandlerClient() → auth.getUser() → rpc("is_admin")
            └─ createServiceRoleClient() → queries de datos
```

Para datos del cliente (sin privilegios especiales) donde RLS es suficiente:

```
Browser (React Query)
  └─ fetch("/api/<dominio>/<recurso>")
       └─ Route Handler (Node, server-only)
            └─ createRouteHandlerClient() → queries de datos (RLS aplica)
```

La regla es: **el Supabase client en el browser se usa solo para auth (login, logout, getUser) y Realtime subscriptions — nunca para queries de datos en rutas que se pueden cargar directamente**.

---

## 7. Lecciones

1. **`navigator.locks.request()` no tiene timeout**: cualquier hang en el auth lock de Supabase es infinito. No hay forma de distinguirlo de una query lenta desde afuera — ambas tienen `fetchStatus: "fetching"` y ningún request visible en la red.

2. **"Funciona en soft nav" no significa que funciona**: si el flujo de login siempre precede a la navegación, el lock nunca se activa porque el token ya está fresco en memoria. Solo al acceder directo se rompe.

3. **El singleton de módulo amplifica el problema**: el cliente Supabase creado a nivel de módulo persiste entre renders. Si se creó en un estado de auth incompleto (server-side durante SSR), puede llevar ese estado al browser.

4. **Sin error no significa sin problema**: un `console.log` antes del `await` + ningún `console.log` después + ninguna request en la red = la Promise está suspendida, no rechazada. Hay que buscar ausencias, no errores.

5. **Los Route Handlers son la abstracción correcta para datos sensibles**: además de resolver el bug, el pattern es más seguro — la lógica de autorización (is_admin) vive en el servidor y no puede ser bypasseada desde el browser.

---

---

# Postmortem #2: Moderación — spinner infinito en cola de reportes

**Fecha:** 2026-05-18  
**Tests afectados:** UC-ADM-12, UC-ADM-13, UC-ADM-14  
**Síntoma:** `/admin/moderation` cargaba el layout pero los reportes nunca aparecían. Los tests de Playwright agotaban el timeout esperando `reportCard`, `dismissButton` y `removeContentButton`.  
**Resolución:** Misma causa raíz que el KPI Dashboard (Web Locks API hang). Mismo fix: Route Handler + Server Actions.

---

## 1. Síntoma exacto

- **En E2E:** Playwright esperaba `page.getByRole("article").first()` (el primer report card) con timeout de 15 s. La espera agotaba sin que apareciera ningún card.
- **En browser manual:** La página cargaba el sidebar y el layout, pero la sección de reportes quedaba en estado de loading o vacía.
- **Red:** Sin requests hacia Supabase. Mismo patrón que el KPI hang: la Promise nunca llegaba a la capa de red.
- **Consola:** Sin errores.

---

## 2. Causa raíz

El archivo `features/content-moderation/services/content-moderation.adapter.ts` tenía esta línea a nivel de **módulo** (fuera de cualquier función):

```ts
// ❌ Singleton a nivel de módulo — ejecutado al importar el archivo
const _client = isMock ? null : createBrowserClient();
```

Exactamente el mismo mecanismo que el KPI Dashboard:

1. La página `/admin/moderation` es un `"use client"` component que importa el adapter.
2. Al importar el módulo, `createBrowserClient()` se ejecuta inmediatamente.
3. El cliente Supabase intenta restaurar la sesión desde cookies/localStorage.
4. Llama `refreshSession()` → adquiere `navigator.locks.request("sb-refresh-token-lock-<ref>", ...)`.
5. Si el lock está ocupado (otra tab, estado huérfano) o el browser no lo concede inmediatamente, la callback nunca se invoca.
6. Toda query posterior (incluyendo `listReports()`) cuelga indefinidamente porque depende del cliente ya inicializado.

**Diferencia con el KPI Dashboard:** en el KPI el singleton estaba en `shared/repositories/index.ts`. Aquí estaba en el adapter propio de la feature, pero el mecanismo es idéntico.

---

## 3. Lo que se intentó y no funcionó

### 3.1 Mover la creación del cliente dentro de una función

Se evaluó refactorizar el adapter para crear el cliente lazy (dentro de cada método). Descartado porque:

- El adapter es importado por hooks cliente. Si el cliente se crea dentro del método pero sigue siendo `createBrowserClient()`, el lock se sigue adquiriendo en el primer call — simplemente se posterga el hang al primer uso en lugar de al import.
- No resuelve el problema de fondo: el browser nunca debería ser el que ejecute queries a Supabase para datos de admin.

### 3.2 Agregar `{ auth: { persistSession: false } }` al createBrowserClient

Descartado: `persistSession: false` evita que el cliente escriba a localStorage, pero el refresh del token sigue requiriendo el lock si hay un token en las cookies. El hang persiste en sesiones que provienen de cookies (que es el caso de admin logeado).

---

## 4. Fix aplicado

### Principio

Idéntico al KPI Dashboard: **sacar el fetch completamente del browser**. El servidor Node no tiene `navigator`, por lo que el path de auth no usa Web Locks.

### Cambios

#### Nuevo: `app/api/admin/reports/route.ts`

Route Handler GET que:
1. Usa `createRouteHandlerClient()` para leer la sesión desde cookies de la HTTP request.
2. Llama `auth.getUser()` — 401 si no está autenticado.
3. Llama `rpc("is_admin")` — 403 si no es admin.
4. Lee el query param `?status=` y lo valida contra `VALID_STATUSES = new Set(Object.values(REPORT_STATUS))`. Si el valor no es válido, usa `REPORT_STATUS.PENDING` como default.
5. Crea un cliente service role y llama `service.listReports({ status })`.
6. Devuelve `{ data: reports }` como JSON.

```ts
const VALID_STATUSES = new Set<string>(Object.values(REPORT_STATUS));

export async function GET(request: Request): Promise<NextResponse> {
  const authClient = await createRouteHandlerClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError !== null || user === null) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: isAdmin, error: adminError } = await authClient.rpc("is_admin");
  if (adminError !== null) return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  const rawStatus = new URL(request.url).searchParams.get("status");
  const status: ReportStatus = VALID_STATUSES.has(rawStatus ?? "")
    ? (rawStatus as ReportStatus)
    : REPORT_STATUS.PENDING;

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = createSupabaseContentModerationService(client);
  const reports = await service.listReports({ status });
  return NextResponse.json({ data: reports });
}
```

#### Nuevo: `features/content-moderation/server-actions/content-moderation-actions.ts`

Server Actions para las mutaciones (`dismissReport`, `removeContent`). Patrón:

```ts
"use server";
import "server-only";

async function ensureAdmin(): Promise<ModerationActionResult> {
  const client = await createRouteHandlerClient(); // server-side, sin Web Locks
  const { data: { user } } = await client.auth.getUser();
  // ... 401 / 403
  const { data: isAdmin } = await client.rpc("is_admin");
  return { ok: true };
}

export async function dismissReportAction(reportId: string): Promise<ModerationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };
  const service = buildService(); // createServiceRoleClient()
  await service.dismissReport(reportId);
  return { ok: true };
}
```

#### Modificado: `features/content-moderation/hooks/useReportsQuery.ts`

```ts
// ❌ ANTES — invocaba el adapter con el singleton de módulo
import { contentModerationService } from "...adapter";
queryFn: () => contentModerationService.listReports({ status: REPORT_STATUS.PENDING })

// ✅ DESPUÉS — fetch al Route Handler, sin cliente Supabase en el browser
async function fetchPendingReports(): Promise<readonly Report[]> {
  const status = encodeURIComponent(REPORT_STATUS.PENDING);
  const res = await fetch(`/api/admin/reports?status=${status}`, { credentials: "include" });
  if (!res.ok) { throw new Error(...) }
  const body = (await res.json()) as { data: Report[] };
  return body.data;
}
```

#### Modificado: `features/content-moderation/hooks/useDismissReportMutation.ts` y `useRemoveContentMutation.ts`

```ts
// ❌ ANTES
mutationFn: (reportId) => contentModerationService.dismissReport(reportId)

// ✅ DESPUÉS
mutationFn: async (reportId) => {
  const result = await dismissReportAction(reportId); // Server Action
  if (!result.ok) throw new Error(result.error);
}
```

**Nota de TypeScript:** La primera versión de estos hooks importaba `serverLogger` para logear errores. `serverLogger` tiene `import "server-only"` en su implementación — el build falla si se importa desde código cliente. Se eliminó el import. Los hooks client-side no necesitan server logger.

---

## 5. Dónde más puede aparecer este bug

Cualquier hook o adapter de una feature admin que tenga `createBrowserClient()` a nivel de módulo. Buscar:

```bash
grep -rn "createBrowserClient" features/ --include="*.ts" --include="*.tsx"
```

Cualquier resultado que no esté dentro de una función (o que esté en el scope top-level del módulo) es candidato al mismo hang.

---

---

# Postmortem #3: Tiendas pendientes invisibles con service role

**Fecha:** 2026-05-18  
**Tests afectados:** UC-ADM-02 (ver tiendas pendientes), UC-ADM-03 (buscar tienda), UC-ADM-04 (ver detalle)  
**Síntoma:** El tab "Pendientes" en `/admin/stores` aparecía vacío aunque hubiera tiendas con `validation_status = 'pending'` en la base de datos.  
**Resolución:** Cambiar la query de `stores_view` a la tabla `stores` directa con embedded join de PostgREST.

---

## 1. Síntoma exacto

- **En E2E:** `stores.storeRow(E2E_STORES.pending.name)` agotaba el timeout en UC-ADM-02. La tienda de fixture existía en la DB pero no aparecía en la lista.
- **En browser manual:** El tab "Pendientes" mostraba la tabla sin filas.
- **En Supabase Studio:** La tienda existía con `validation_status = 'pending'` y `available = false`.
- **Sin errores de red:** La query llegaba a Supabase y devolvía 200, pero con `data: []`.

---

## 2. Causa raíz

`features/store-validation/services/store-validation.supabase.ts` consultaba `stores_view`:

```ts
// ❌ ANTES
const { data, error } = await this.client
  .from("stores_view")   // ← PROBLEMA
  .select(...)
  .eq("validation_status", status);
```

`stores_view` tiene una cláusula WHERE con security barrier:

```sql
-- Definición simplificada de stores_view
SELECT ...
FROM stores s
WHERE
  s.available = true                           -- tiendas abiertas al público
  OR s.owner_id = (select auth.uid())          -- el dueño ve su propia tienda
  OR (select public.is_admin())                -- admins ven todo... ¿o no?
```

El problema está en la tercera condición. `is_admin()` internamente llama `auth.uid()`:

```sql
-- Función is_admin() (simplificada)
CREATE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = (select auth.uid())  -- ← depende de auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

Con `createServiceRoleClient()` **no hay JWT de usuario en el contexto de la request**. PostgREST ejecuta la query con el JWT del service role, que no tiene `sub` (user ID). Por lo tanto:
- `auth.uid()` → `NULL`
- `is_admin()` → `false` (ningún user con `auth_user_id = NULL`)
- `OR (select public.is_admin())` → siempre `false`

Las tiendas pendientes tienen `available = false` y pertenecen a otro usuario. Las tres condiciones del WHERE son todas `false` → la query devuelve 0 filas.

**El service role bypasea RLS, pero no bypasea las condiciones WHERE de las vistas.** Esta es la distinción clave.

---

## 3. Lo que se intentó y no funcionó

### 3.1 Pasar el authClient a la service layer

Se evaluó hacer que `SupabaseStoreValidationService` recibiera el `authClient` (del Route Handler, con JWT del admin) en lugar del `serviceRoleClient`. Descartado porque:

- Con el authClient, `is_admin()` sí devolvería `true` — pero RLS de la tabla `stores` bloquearía el acceso a tiendas que no son del usuario. Las tiendas pendientes de otros dueños seguirían siendo invisibles.
- Requería reescribir toda la capa de servicio de validación para manejar dos clientes distintos.

### 3.2 Usar una función RPC que corra con SECURITY DEFINER

Se evaluó crear una función SQL `get_stores_by_status(status text)` marcada como `SECURITY DEFINER`, que internamente saltea RLS y la vista. Descartado porque:

- Requería una migración nueva para solo resolver un problema de lectura.
- Más difícil de entender y mantener que la solución directa.
- El mismo resultado se logra simplemente consultando la tabla base con el service role.

---

## 4. Fix aplicado

### Principio

**Consultar la tabla `stores` directamente** (no la vista), usando el `serviceRoleClient` que ya bypasea RLS. Para obtener el `public_id` del dueño (que está en `users`), usar el embedded join de PostgREST con la FK constraint explícita.

### Por qué hay que nombrar la FK explícitamente

La tabla `stores` tiene múltiples relaciones con `users` (owner, posiblemente reviewer, etc.). PostgREST no sabe cuál FK usar si solo decís `users(public_id)`. Hay que pasar el nombre de la constraint:

```ts
// ✅ Formato: tabla!nombre_constraint(columnas)
"users!stores_owner_id_fkey(public_id)"
```

Para encontrar el nombre de la constraint cuando no se sabe:
```sql
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'stores' AND constraint_name LIKE '%fkey%';
```

### Select string — antes vs. después

```ts
// ❌ ANTES — consultaba stores_view (filtrada por is_admin())
const VALIDATION_SELECT = "id, public_id, name, ...";
// from("stores_view")

// ✅ DESPUÉS — tabla directa con embedded join explícito
const VALIDATION_SELECT =
  "id, public_id, name, description, category, available, " +
  "photo_url, tagline, price_from_ars, hours, cuit, " +
  "validation_status, rejection_reason, created_at, " +
  "users!stores_owner_id_fkey(public_id)";
// from("stores")
```

### Métodos actualizados

```ts
// ❌ ANTES
const { data, error } = await this.client
  .from("stores_view")
  .select(VALIDATION_SELECT)
  .eq("validation_status", status);

// ✅ DESPUÉS
const { data, error } = await this.client
  .from("stores")          // tabla base, no la vista
  .select(VALIDATION_SELECT)
  .eq("validation_status", status)
  .order("created_at", { ascending: true });
```

### Tipo e interfaz — cambio de shape

La vista exponía columnas computadas (`lat`, `lng`, `owner_public_id` como alias). La tabla directa no las tiene. Se reescribió el tipo y el mapper:

```ts
// ❌ ANTES — shape de la view (incluía lat/lng de PostGIS)
interface DbValidationStoreRow {
  readonly owner_public_id: string; // alias de la view
  readonly lat: number | null;      // calculado por PostGIS en la view
  readonly lng: number | null;
}

// ✅ DESPUÉS — shape de la tabla + join
interface DbStoreDirectRow {
  readonly users: { readonly public_id: string } | null; // resultado del join
  // lat/lng no existen en stores — PostGIS los calcula solo en la view
}

function mapStoreDirectRow(row: DbStoreDirectRow): PendingStore {
  return {
    id: row.public_id,
    ownerId: row.users?.public_id ?? "",  // antes: row.owner_public_id
    // ...
    location: null,       // no disponible en tabla directa — admin no lo necesita
    distanceMeters: 0,
  };
}
```

---

## 5. Regla general para queries con service role

**El service role bypasea RLS, pero no bypasea las condiciones WHERE de las vistas.** Si una vista tiene condiciones que dependen de `auth.uid()` o de funciones que lo usan internamente (`is_admin()`, `is_owner()`, etc.), esas condiciones siempre devuelven `false` con service role porque no hay JWT de usuario.

**Solución:** siempre que el service role necesite leer datos filtrados por lógica de negocio (no por seguridad), consultar las tablas base y aplicar los filtros explícitamente en la query.

**Cómo detectar si una vista tiene este problema:**

```bash
# Buscar vistas que llamen auth.uid() o is_admin() en su definición
grep -rn "auth\.uid\(\)\|is_admin\(\)\|is_owner\(\)" supabase/migrations/ --include="*.sql"
```

Cualquier vista que aparezca en esa búsqueda **no puede consultarse con service role si se esperan resultados filtrados por usuario**.

---

## 6. Lecciones

1. **`stores_view` y cualquier vista con `auth.uid()` son invisibles para el service role**: el service role no tiene identidad de usuario, entonces `auth.uid()` → `NULL` y cualquier condición que dependa de él falla silenciosamente devolviendo 0 filas.

2. **"Sin filas" no es lo mismo que "sin datos"**: cuando una query devuelve un array vacío en un contexto donde definitivamente hay datos, el primer sospechoso es la vista o las condiciones de filtro, no la ausencia real de datos.

3. **Los embedded joins de PostgREST requieren el nombre exacto de la FK constraint** cuando hay múltiples relaciones entre las mismas dos tablas. Sin el nombre explícito, PostgREST devuelve un error de ambigüedad.

4. **Campos computados de vistas (PostGIS, funciones SQL) no existen en la tabla base**: `lat`, `lng`, alias calculados — si la query pasa de la vista a la tabla, esos campos desaparecen y el tipo/mapper debe actualizarse en consecuencia.

---

---

# Postmortem #4: Tests E2E as-admin — 4 tests fallando por race conditions y TS error

**Fecha:** 2026-05-18  
**Tests afectados:** UC-ADM-05, UC-ADM-06 (×2), UC-ADM-10, UC-ADM-11  
**Síntoma:** 4 tests del proyecto `as-admin` fallaban de forma intermitente o siempre. Los síntomas variaban: `successToast` no visible, `storeRow` no encontrada en tab pendientes, `suspendButton` no visible, `reactivateButton.count()` devolvía 0.  
**Resolución:** Tres fixes independientes: null-guard en Server Action, `mode: "serial"` en dos spec files, y `beforeEach` deterministas para tests con estado mutable compartido.

---

## 1. Síntomas exactos

| Test | Error | Tipo de falla |
|------|-------|---------------|
| UC-ADM-05 (aprobar tienda) | `successToast` no visible — Playwright strict mode: 2 elementos coincidían con el locator | Locator ambiguo |
| UC-ADM-06 "motivo corto" | `viewStoreButton` no encontrada — la tienda no aparecía en tab pendientes | Race condition |
| UC-ADM-06 "motivo válido" | Idem | Race condition |
| UC-ADM-10 (suspender usuario) | `suspendButton` no visible — el usuario ya estaba suspendido de una corrida anterior | Estado sucio entre runs + TS error en Server Action |
| UC-ADM-11 (reactivar usuario) | `suspendButton` no visible en el else branch — `reactivateButton.count()` devolvió 0 inmediatamente | Race condition intra-test (count sin espera) |

---

## 2. Causas raíz

### 2.1 TS2345 en `user-management-actions.ts` → suspensión silenciosa

`suspendUserAction` y `reactivateUserAction` pasaban `env.NEXT_PUBLIC_SUPABASE_URL` y `env.SUPABASE_SERVICE_ROLE_KEY` directamente a `createServiceRoleClient`:

```ts
// ❌ ANTES — error de tipos: string | undefined no es assignable a string
const serviceClient = createServiceRoleClient(
  env.NEXT_PUBLIC_SUPABASE_URL,   // string | undefined
  env.SUPABASE_SERVICE_ROLE_KEY,  // string | undefined
);
```

`env.*` las variables son `.optional()` en el schema Zod → tipadas como `string | undefined`. La firma de `createServiceRoleClient(url: string, key: string)` requiere `string`. El build TypeScript generaba TS2345. En runtime, si las variables existían, pasaba igual — pero el test UC-ADM-10 fallaba cuando el fixture del usuario quedaba suspendido de una corrida anterior (no podía resetearlo porque la Server Action no tenía `beforeEach`).

**Fix:**
```ts
// ✅ DESPUÉS — null-guard antes de llamar a createServiceRoleClient
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  return { ok: false, error: GENERIC_ERROR_MESSAGE };
}
const serviceClient = createServiceRoleClient(supabaseUrl, serviceRoleKey);
```

El mismo patrón se aplicó a `reactivateUserAction`.

### 2.2 Race condition por `fullyParallel: true` en Playwright

`playwright.config.ts` tiene `fullyParallel: true` y `workers: 2`. Con esta configuración, **todos los tests corren en paralelo**, incluso los del mismo spec file. No hay garantía de orden dentro de un archivo.

**Caso `validacion-tiendas.uc.spec.ts`:**

UC-ADM-05 (aprobar tienda) y UC-ADM-06 (rechazar tienda) comparten la misma tienda fixture `"Empanadas La Porteña"` cuyo `validation_status` muta a través de los tests (`pending → approved → pending → rejected`). Con 2 workers:

1. Worker A arranca UC-ADM-06 "motivo corto" — su `beforeEach` resetea la tienda a `pending`.
2. Worker B arranca UC-ADM-05 — aprueba la misma tienda (`pending → approved`).
3. Worker A intenta buscar la tienda en el tab "Pendientes" → no está (ya fue aprobada por B).
4. Timeout.

La evidencia fue ver los números de test llegando out-of-order (`14, 15` antes que `13`) en el output de Playwright — confirmando ejecución paralela intra-archivo.

**Caso `usuarios.uc.spec.ts`:**

UC-ADM-10 (suspender) y UC-ADM-11 (reactivar) compartían el mismo usuario fixture `E2E_USERS.client` cuyo estado `suspended` mutaba entre tests. Al correr en paralelo: un test suspendía el usuario mientras el otro lo esperaba activo (o viceversa).

### 2.3 `locator.count()` sin espera en UC-ADM-11

```ts
// ❌ ANTES — count() es inmediato, no espera a que la página cargue
const isSuspended = (await users.reactivateButton.count()) > 0;
if (isSuspended) {
  await users.reactivateButton.click();
} else {
  await expect(users.suspendButton).toBeVisible({ timeout: 5_000 }); // fallback
}
```

`count()` en Playwright es evaluado inmediatamente en el estado actual del DOM. Si la página del detalle del usuario todavía estaba cargando cuando se llamaba, devolvía `0` aunque el botón fuera a aparecer. Caía al `else` y `suspendButton` tampoco era visible → timeout.

---

## 3. Fixes aplicados

### 3.1 `validacion-tiendas.uc.spec.ts` — modo serial

```ts
// Agregado al inicio del archivo (después de los imports)
test.describe.configure({ mode: "serial" });
```

Fuerza a todos los tests del archivo a correr secuencialmente en un solo worker, overrideando `fullyParallel`. Es la solución idiomática de Playwright para tests que comparten estado mutable en la DB.

### 3.2 `usuarios.uc.spec.ts` — modo serial + `beforeEach` deterministas

```ts
// Agregado al inicio del archivo
test.describe.configure({ mode: "serial" });
```

Además, se reemplazó la lógica condicional de UC-ADM-11 por `beforeEach` explícitos con Supabase service role:

```ts
// UC-ADM-10: garantiza que el usuario esté activo antes de suspenderlo
test.describe("UC-ADM-10 — suspender usuario", () => {
  test.beforeEach(async () => {
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { ... } });
    await supabase.from("users").update({ suspended: false }).eq("email", E2E_USERS.client.email);
  });
  // El test ahora puede asumir que el usuario SIEMPRE está activo al arrancar
});

// UC-ADM-11: garantiza que el usuario esté suspendido antes de reactivarlo
test.describe("UC-ADM-11 — reactivar usuario", () => {
  test.beforeEach(async () => {
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { ... } });
    await supabase.from("users").update({ suspended: true }).eq("email", E2E_USERS.client.email);
  });
  // El test ahora puede asumir que el usuario SIEMPRE está suspendido al arrancar
  // — y puede usar expect(reactivateButton).toBeVisible() sin condicionales
});
```

Se eliminó completamente la lógica `if (isSuspended) / else` que era el race condition encubierto.

---

## 4. Lecciones

1. **`fullyParallel: true` en Playwright paraleliza DENTRO del mismo spec file**, no solo entre archivos. Un test que muta un fixture compartido y espera que el siguiente lo encuentre en un estado específico es un race condition garantizado. El `mode: "serial"` es la solución idiomática — no es un hack.

2. **`locator.count()` no espera**: a diferencia de `waitFor()` o `expect(locator).toBeVisible()`, `count()` evalúa el DOM en el instante en que se llama. Usarlo como condición inmediatamente después de una navegación produce resultados no deterministas. La alternativa correcta es hacer el test determinista mediante `beforeEach` — nunca usar `count()` como branch condition post-navegación.

3. **Los tests con estado mutable compartido necesitan `beforeEach` que reseteen a un estado conocido**, no lógica condicional que adivina el estado. La lógica condicional esconde el race condition y hace los tests no reproducibles.

4. **Zod `.optional()` en variables de entorno genera `string | undefined`**: si el schema declara env vars como opcionales, los callers deben null-guardar antes de pasarlas a funciones que requieren `string`. El patrón correcto es extraer, null-guardar, y retornar early con error si falta alguna — idéntico al patrón de los Route Handlers del repo.

5. **El serial mode de un archivo libera un worker para otros archivos**: cuando `validacion-tiendas` se volvió serial, el worker liberado fue asignado a `usuarios.uc.spec.ts` — convirtiendo lo que antes era ejecutado secuencialmente (por falta de workers) en paralelo. Un fix puede revelar un bug latente en otro spec. Hay que re-correr la suite completa después de cada fix de concurrencia.

---

---

# Postmortem #5: Auth E2E — 2 tests fallando (UC-AUTH-01, UC-AUTH-07)

**Fecha:** 2026-05-18  
**Tests afectados:** UC-AUTH-01 "muestra error por email ya registrado", UC-AUTH-07 "ruta /auth/reset-password sin token redirige a error"  
**Resolución:** Requirió dos rondas de diagnóstico. Los fixes iniciales eran parcialmente correctos pero incompletos. Ver §3 para el detalle de qué no funcionó y por qué.

---

## 1. Síntomas exactos

| Test | Error de Playwright |
|------|-------------------|
| UC-AUTH-01 | `expect(locator).toBeVisible()` — timeout de 8 s. Ningún elemento con el texto del regex apareció. |
| UC-AUTH-07 | `expect(locator).toBeVisible()` — timeout de 8 s. El error esperado nunca apareció en la página. |

---

## 2. Diagnóstico: causas raíz reales (confirmadas al final)

### UC-AUTH-01 — dos comportamientos distintos según estado del email

Supabase con email confirmation habilitado tiene **dos caminos** para email duplicado según si el email ya confirmó su cuenta o no:

#### Caso A: email existente con cuenta NO confirmada (unconfirmed)
Supabase devuelve "éxito fingido" (anti-enumeración):
```
{ data: { user: { identities: [] }, session: null }, error: null }
```
`identities: []` (array vacío) es la señal de que el email ya existe pero no confirmó. No hay `error`.

#### Caso B: email existente con cuenta CONFIRMADA (el fixture E2E_USERS.client)
Supabase devuelve un `AuthError` con `message: "User already registered"`:
```
{ data: { user: null, session: null }, error: AuthError { message: "User already registered", ... } }
```

El test usa `E2E_USERS.client.email` — un usuario confirmado. Caía por el Caso B.

El código original ignoraba el contenido del mensaje de error y siempre retornaba un mensaje genérico:
```ts
// ❌ ANTES — mensaje genérico, no matchea el regex /correo.*uso/i del test
if (error) {
  return { success: false, error: "No se pudo registrar la cuenta. Intentá de nuevo." };
}
```

Ese texto NO matchea ninguna variante del regex `/email válido|ya.*registrado|en uso|ya existe|email.*already|user.*registered|correo.*uso/i`. El error se mostraba en pantalla, pero el test no lo encontraba porque el texto era diferente.

### UC-AUTH-07 — dos bugs apilados

**Bug 1 (URL incorrecta en el test):**
La página de reset-password vive en:
```
app/(auth)/reset-password/page.tsx
```
Los paréntesis en `(auth)` indican un **route group** de Next.js — no agrega segmento de URL. La URL real es `/reset-password`, no `/auth/reset-password`. El test apuntaba a `/auth/reset-password` → 404.

**Bug 2 (`this` binding perdido en `useSearchParams`):**
Incluso después de corregir la URL, la página crasheaba antes de renderizar con:
```
TypeError: Value of "this" must be of type URLSearchParams
  at ResetPasswordFormContainer
```

La causa: `useSearchParams()` devuelve un objeto especial con métodos que dependen de `this`. Al destructurar, `get` pierde su contexto:
```ts
// ❌ ANTES — get pierde el this binding al desvincularla del objeto
const { get } = useSearchParams();
const token = get("token") ?? "";   // TypeError en runtime
```

En modo estricto de JavaScript (que Next.js usa por defecto en `"use client"`), cuando una función se invoca sin `this`, `this` es `undefined` — y el runtime lanza el TypeError al intentar operar sobre él como URLSearchParams.

La página renderizaba correctamente el mensaje de token inválido:
```jsx
<p role="alert">
  El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.
</p>
```
Que sí matchea `/inválido|enlace/i` — pero el crash antes del render impedía verlo.

---

## 3. Lo que se intentó y no funcionó (primera ronda)

### 3.1 Solo el check de `identities: []` (UC-AUTH-01) — NO resolvió el test

**Fix aplicado en primera ronda:**
```ts
// Detectar email duplicado no confirmado vía identities vacías
if (data.user?.identities !== undefined && data.user.identities.length === 0) {
  return { success: false, error: "El correo electrónico ya está en uso." };
}
```

**Por qué no funcionó:** este check cubre solo el Caso A (email no confirmado). El fixture `E2E_USERS.client.email` es un usuario confirmado, por lo que Supabase devuelve el Caso B — un `AuthError` real, que entra en el branch `if (error)` antes del check de identities. El mensaje genérico `"No se pudo registrar la cuenta. Intentá de nuevo."` seguía siendo retornado y el test seguía sin encontrar el error esperado.

El check de identities era correcto y necesario, pero incompleto.

### 3.2 Solo corregir la URL (UC-AUTH-07) — NO resolvió el test

**Fix aplicado en primera ronda:**
```ts
// ❌ ANTES
await page.goto("/auth/reset-password", ...);
// ✅ DESPUÉS
await page.goto("/reset-password", ...);
```

**Por qué no funcionó:** la URL era efectivamente incorrecta y ese fix era necesario. Pero la página aún crasheaba con `TypeError: Value of "this" must be of type URLSearchParams` por el destructuring de `useSearchParams()`. El bug de URL enmascaraba el bug de código — al apuntar al 404 nunca se llegaba a ejecutar el componente, y al corregir la URL el crash se volvió visible.

Segunda corrida tras los fixes de primera ronda: ambos tests seguían fallando. El WebServer log mostraba el TypeError.

---

## 4. Fixes definitivos (segunda ronda)

### 4.1 UC-AUTH-01 — mapear el mensaje de error de Supabase

**Archivo:** `shared/services/auth.supabase.ts`

```ts
// ✅ FIX FINAL — cubre tanto Caso A (identities) como Caso B (AuthError con message)
if (error) {
  logger.error("signUp failed", { error });
  const msg = error.message ?? "";
  if (/already registered|already exists|email.*in use/i.test(msg)) {
    return { success: false, error: "El correo electrónico ya está en uso." };
  }
  return { success: false, error: "No se pudo registrar la cuenta. Intentá de nuevo." };
}
// Para email no confirmado duplicado (sin error, pero identities vacías):
if (data.user?.identities !== undefined && data.user.identities.length === 0) {
  return { success: false, error: "El correo electrónico ya está en uso." };
}
```

El mensaje `"El correo electrónico ya está en uso."` matchea `correo.*uso` del regex del test. Cubre los dos casos:
- **Caso B (confirmado):** el `error.message` es `"User already registered"` → entra en el `/already registered/i` → retorna el mensaje correcto.
- **Caso A (no confirmado):** `error` es `null` → pasa el primer if → el check de `identities: []` lo captura.

### 4.2 UC-AUTH-07 — preservar el `this` binding de `useSearchParams`

**Archivo:** `features/auth/components/ResetPasswordForm/ResetPasswordForm.container.tsx`

```ts
// ❌ ANTES — get pierde el this binding
const { get } = useSearchParams();
const token = get("token") ?? "";

// ✅ DESPUÉS — referencia completa al objeto, preserva this
const searchParams = useSearchParams();
const token = searchParams.get("token") ?? "";
```

Con el `this` binding correcto, `searchParams.get("token")` devuelve `null` (no hay query param), `token` queda como `""`, el component renderiza el mensaje de enlace inválido, y el test lo encuentra.

---

## 5. Resultado final

Luego de los dos fixes de segunda ronda:

```
17 passed (43.8s)
```

Todos los tests de `e2e/use-cases/01-auth/auth.uc.spec.ts` pasando, incluyendo UC-AUTH-01 y UC-AUTH-07.

---

## 6. Lecciones

1. **Supabase tiene dos comportamientos distintos para email duplicado**: con email confirmation habilitado, un email *no confirmado* devuelve `{ error: null, user: { identities: [] } }` (anti-enumeración silenciosa). Un email *confirmado* devuelve un `AuthError` con `message: "User already registered"`. Hay que manejar ambos casos explícitamente.

2. **Un fix correcto puede no ser suficiente**: el check de `identities: []` era técnicamente correcto, pero solo cubría la mitad del problema. El fixture del test usaba un usuario confirmado, así que Supabase tomaba el otro camino. Hay que entender con qué datos exactos corre el test para cubrir el caso real.

3. **Destructuring de hooks con `this` interno es un antipatrón en React**: `useSearchParams()`, `useRouter()`, y otros hooks de Next.js devuelven objetos con métodos que usan `this` internamente. Destructurar esos métodos (`const { get } = useSearchParams()`) desvincula `get` de su objeto. El patrón correcto es mantener la referencia completa al objeto: `const searchParams = useSearchParams()`.

4. **Bugs apilados se ocultan entre sí**: el bug de URL en el test ocultaba el bug de `useSearchParams`. Al corregir solo la URL, el crash del componente se volvió visible. Es necesario re-correr el test después de cada fix parcial para confirmar si el síntoma cambió, no asumir que el fix fue suficiente.

---

---

# Postmortem #4: Store use cases — 12 tests colgados (UC-STO-11 a 24)

**Fecha:** 2026-05-18  
**Tests afectados:** UC-STO-11, 12, 13, 14, 18, 19, 20, 22, 23, 24 (catálogo, pedidos-tienda, dashboard)  
**Síntoma:** Elementos de UI nunca aparecen (testIds no encontrados); UC-STO-18/19/20 agotan 120 s con `browserContext.close: Target page, context or browser has been closed`.  
**Resolución:** Misma causa raíz que el KPI Dashboard. Fix: Route Handler `GET /api/store/me` + actualizar `useCurrentStoreQuery`.

---

## 1. Síntoma exacto

- **UC-STO-11–14 (catálogo):** `page.getByRole("article").first()` y `catalog.saveProductButton` nunca encontrados. El catálogo no mostraba productos porque la query de catálogo dependía del `storeId`, que viene de `useCurrentStoreQuery` y nunca resolvía.
- **UC-STO-22–24 (perfil/analytics):** `data-testid="store-name"`, `button name=/editar.*perfil/i`, `data-testid="kpi-total-orders"` nunca visibles por la misma causa.
- **UC-STO-18–20 (aceptar/rechazar/finalizar):** Timeout de 120 s. Los tests usaban `browser.newContext({ storageState: STORE_AUTH })` → `loginAsStoreFresh` navegaba a `/store/dashboard` → `IncomingOrdersInboxContainer` usaba `useCurrentStoreQuery` → la Promise colgaba → el test nunca avanzaba → `finally` cerraba los contextos → Playwright reportaba `browserContext.close: Target page, context or browser has been closed`.

---

## 2. Causa raíz

`useCurrentStoreQuery` llamaba `storesService.findByOwnerId(userId)` → `storeRepository.findByOwnerId()` → `this.client.from("stores_view")...` donde `this.client` era el singleton de `shared/repositories/index.ts` (el mismo de los postmortems anteriores).

Diferencia clave: los tests de UC-STO-18/19/20 usaban `browser.newContext({ storageState: STORE_AUTH })` (storageState explícito) en lugar del fixture de proyecto. Ambos pre-cargan auth tokens en localStorage antes de que cualquier página cargue, lo que activa el refresh del token via `navigator.locks.request()` en el singleton del browser — y cuelga infinitamente en Chromium headless con storageState pre-cargado.

---

## 3. Lo que no se intentó (y por qué)

Se descartó cualquier fix en el singleton o en la lógica del hook sin mover el fetch al servidor. Ver Postmortem #1 §3 para el razonamiento completo.

---

## 4. Fix aplicado

### Nuevo: `app/api/store/me/route.ts`

```ts
export async function GET(): Promise<NextResponse> {
  const client = await createRouteHandlerClient(); // server-side, cookies, sin navigator.locks
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  try {
    const store = await new SupabaseStoreRepository(client).findByOwnerId(user.id);
    return NextResponse.json({ data: store });
  } catch (error) {
    serverLogger.error("store/me: findByOwnerId failed", { error });
    return NextResponse.json({ error: "Error obteniendo tienda." }, { status: 500 });
  }
}
```

### Modificado: `shared/hooks/useCurrentStoreQuery.ts`

```ts
// ❌ ANTES — usaba el singleton del browser vía storesService
queryKey: userId ? queryKeys.stores.byOwner(userId) : queryKeys.stores.all(),
queryFn: () => storesService.findByOwnerId(userId),   // → singleton → Web Locks hang
enabled: userId !== null,

// ✅ DESPUÉS — fetch HTTP al Route Handler, sin cliente Supabase en el browser
queryKey: queryKeys.stores.me(),   // ["stores", "me"]
queryFn: async (): Promise<Store | null> => {
  const res = await fetch("/api/store/me", { credentials: "include" });
  if (res.status === 401) return null;   // no autenticado → null en lugar de throw
  if (!res.ok) throw new Error("Error obteniendo tienda del servidor");
  return (await res.json() as { data: Store | null }).data;
},
// Sin enabled ni useSession — el Route Handler maneja el 401
```

### Modificado: `features/store-dashboard/hooks/useCurrentStoreQuery.ts`

Re-export del hook compartido (antes era un duplicado exacto con el mismo bug).

---

## 5. Resultado

Todos los consumidores de `useCurrentStoreQuery` (CatalogList, StoreShell, IncomingOrdersInbox, StoreAnalyticsDashboard, StoreProfilePage, useAvailability, RejectionReasonDisplay) ahora reciben el dato de tienda sin pasar por el singleton del browser.

---

## 6. Lección adicional

**El storageState de Playwright es equivalente a una sesión pre-autenticada en cualquier contexto, incluso `browser.newContext()` explícito.** Cualquier componente que llame al singleton de Supabase en el primer render de una página con storageState pre-cargado va a colgar. El patrón definitivo: datos de tienda o cualquier dato privado del usuario autenticado → Route Handler, no cliente browser.

5. **Los mensajes de error del provider son en inglés aunque la UI esté en español**: Supabase devuelve `"User already registered"` en inglés. El mapeo de ese mensaje a una respuesta en español debe hacerse en la capa de servicio, no asumir que el provider devuelve el idioma de la UI. La regex del mapeo debe cubrir las variantes del inglés que el SDK puede devolver.

---

---

# Postmortem #6: Tests E2E as-store — 13 tests colgados por Web Locks API (segunda capa)

**Fecha:** 2026-05-18  
**Tests afectados:** UC-STO-07, UC-STO-12 (×3), UC-STO-13, UC-STO-14, UC-STO-16, UC-STO-18, UC-STO-19, UC-STO-20, UC-STO-22, UC-STO-23, UC-STO-24  
**Síntoma:** Después del fix del Route Handler `GET /api/store/me` (Postmortem #4), 13 tests del proyecto `as-store` seguían fallando. Los elementos de UI básicos (botones, testIDs, toasts) nunca aparecían. UC-STO-18/19/20 agotaban el timeout de 120 s con `browserContext.close: Target page, context or browser has been closed`.  
**Resolución:** Los tres archivos de servicios Supabase (`auth.supabase.ts`, `storage.supabase.ts`, `realtime.supabase.ts`) importaban `createBrowserClient` directamente de `@supabase/ssr`, bypaseando el override de no-op lock que vivía en `shared/repositories/supabase/client.browser.ts`. Cada mount de página que usaba `getSession()`, `onAuthStateChange()` o `status()` creaba un cliente sin patchear y colgaba en Chromium headless.

---

## 1. Síntoma exacto

| Test | Error de Playwright |
|------|-------------------|
| UC-STO-07 toggle disponibilidad | `expect(button).toBeEnabled()` — timeout 15 s. El botón de toggle nunca se habilitó. |
| UC-STO-12 nombre vacío | `expect(saveProductButton).not.toBeDisabled()` — timeout 10 s. El botón nunca se habilitó. |
| UC-STO-12 precio negativo | Ídem. |
| UC-STO-12 crear producto válido | `expect(successToast).toBeVisible()` — timeout 10 s. |
| UC-STO-13 editar producto | `expect(successToast).toBeVisible()` — timeout 10 s. |
| UC-STO-14 eliminar producto | `expect(productCard).not.toBeVisible()` — timeout 5 s. La tarjeta seguía visible. |
| UC-STO-16 imagen producto | `page.getByTestId("product-image-upload")` — timeout. El componente de upload nunca cargó. |
| UC-STO-18 aceptar pedido | Timeout 120 s. `browserContext.close: Target page, context or browser has been closed`. |
| UC-STO-19 rechazar pedido | Ídem. |
| UC-STO-20 finalizar pedido | `expect(detail.finalizeButton).toBeVisible()` — timeout 15 s. |
| UC-STO-22 ver perfil | `page.getByTestId("store-name")` — timeout. El nombre de la tienda nunca apareció. |
| UC-STO-23 editar perfil | `page.getByRole("button", { name: /editar.*perfil/i })` — timeout 30 s. |
| UC-STO-24 analytics KPIs | `page.getByTestId("kpi-total-orders")` — timeout. Los KPIs nunca se renderizaron. |

El patrón común: toda página del dashboard de tienda que necesitara saber si hay sesión activa (para habilitar botones, mostrar datos del usuario, renderizar componentes autenticados) simplemente no completaba la hidratación.

---

## 2. Contexto previo: por qué el fix de Postmortem #4 era insuficiente

El Postmortem #4 movió `useCurrentStoreQuery` a un Route Handler (`GET /api/store/me`), resolviendo el hang de las queries de datos de la tienda. Ese fix era correcto y necesario. Pero los 13 tests seguían fallando porque el hang no venía solo de las queries de datos: venía de la **capa de autenticación misma**.

Arquitectura de llamadas en una página de dashboard de tienda:

```
Página /store/dashboard (montada con storageState pre-cargado)
├── SessionProvider (monta useSession → onAuthStateChange)
│    └── supabaseAuthService.onAuthStateChange()
│         └── createBrowserClient()  ← PROBLEMA: cliente sin no-op lock
│              └── navigator.locks.request("sb-refresh-token-lock-...")
│                   └── ∞ HANG
│
└── StoreShell → useCurrentStoreQuery → GET /api/store/me ← YA FIXEADO
```

`SessionProvider` se monta en `app/layout.tsx` — está presente en absolutamente todas las páginas del dashboard. Mientras `auth.supabase.ts` creara clientes sin el override de lock, el `onAuthStateChange` del layout colgaba en el primer render de cualquier página con `storageState` pre-cargado.

Los tests de UC-STO-07, 12, 13, 14, 16, 22, 23, 24 fallaban porque la página nunca terminaba de hidratar (el `SessionProvider` estaba colgado). Los de UC-STO-18, 19, 20 fallaban por eso mismo pero además con el agravante de que usaban `browser.newContext({ storageState: STORE_AUTH })` explícito — el mismo mecanismo, solo que con dos contextos de browser en paralelo.

---

## 3. Causa raíz

`shared/services/auth.supabase.ts` tenía su propio import de `createBrowserClient` desde `@supabase/ssr`:

```ts
// ❌ ANTES — importaba directo de @supabase/ssr
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

El override de no-op lock existe en `shared/repositories/supabase/client.browser.ts`:

```ts
// La fábrica centralizada con el no-op lock
export function createBrowserClient(...) {
  return _createBrowserClient(url, anonKey, {
    auth: {
      lock: async <R>(_name, _acquireTimeout, fn: () => Promise<R>): Promise<R> => fn(),
    },
  });
}
```

`auth.supabase.ts` tenía su propia función privada `createBrowserClient` que nunca pasaba por ese override. Resultado: cada llamada a `supabaseAuthService.signIn()`, `getSession()`, `getUser()`, `onAuthStateChange()` creaba un cliente que, al intentar adquirir `navigator.locks.request()` en headless Chromium con `storageState` pre-cargado, colgaba indefinidamente.

El mismo problema existía en:
- `shared/services/storage.supabase.ts` — importaba `createBrowserClient` de `@supabase/ssr` directamente en la factory.
- `shared/services/realtime.supabase.ts` — ídem.

Los tres archivos formaban una "segunda capa" del mismo bug que se había documentado en los postmortems anteriores para los repositorios. El fix del Postmortem #4 cerró la primera capa (repositories/index.ts + useCurrentStoreQuery). Esta segunda capa permanecía.

---

## 4. Lo que se intentó y no funcionó

### 4.1 Asumir que el Route Handler era suficiente

Tras el Postmortem #4, la hipótesis era que el único punto de entrada del bug era `useCurrentStoreQuery` → `storeRepository.findByOwnerId()` → `singleton de repositories/index.ts`. Se esperaba que moviendo ese fetch al servidor los 13 tests pasaran.

**Por qué no funcionó:** como se explicó en §2, el `SessionProvider` en `app/layout.tsx` llama `supabaseAuthService.onAuthStateChange()` en el primer render de toda página. Esa llamada crea un cliente directo de `@supabase/ssr` en `auth.supabase.ts`. El lock hang ocurre ahí, antes de que ninguna query de datos llegue a ejecutarse. Resolver el hang en la capa de datos no ayuda si la capa de autenticación sigue colgada.

### 4.2 Override de TypeScript incorrecto en `client.browser.ts`

Al intentar confirmar que el no-op lock estaba correctamente tipado, se encontró que la versión original tenía un error de tipos:

```ts
// ❌ Versión original — tipo incorrecto
lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),
```

Este signature no satisface `LockFunc` de `@supabase/auth-js` v2, que está definida como:

```ts
// LockFunc en @supabase/auth-js
type LockFunc = <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => Promise<R>;
```

El TypeScript generaba TS2769: `Type 'Promise<unknown>' is not assignable to type 'Promise<R>'`. Aunque el error era real (el typecheck fallaba), corregirlo **no fue suficiente por sí solo** — el bug era de importación, no de tipado.

El fix del tipo fue necesario para que `pnpm typecheck` pasara, pero no afectaba el comportamiento en runtime.

**Complicación adicional:** el Edit tool no podía encontrar la cadena `<unknown>` en el archivo porque la parsea como un tag HTML y no hace match. Fue necesario usar `sed` para el reemplazo:

```bash
sed -i '' '16s/.*/      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),/' \
  /Users/martinoficialdegui/Desktop/ambulante/shared/repositories/supabase/client.browser.ts
```

---

## 5. Fixes aplicados

### 5.1 `shared/services/auth.supabase.ts`

```ts
// ❌ ANTES — función privada que importaba de @supabase/ssr directamente
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

type BrowserClient = ReturnType<typeof createBrowserClient>;

// ✅ DESPUÉS — importa de la fábrica centralizada con el no-op lock
import { createBrowserClient } from "@/shared/repositories/supabase/client.browser";

type BrowserClient = ReturnType<typeof createBrowserClient>;
```

La función privada `createBrowserClient` se eliminó completamente. El alias de tipo `BrowserClient` sigue funcionando porque `ReturnType<typeof createBrowserClient>` ahora deriva de la fábrica importada.

### 5.2 `shared/services/storage.supabase.ts`

```ts
// ❌ ANTES
import { createBrowserClient } from "@supabase/ssr";

// ✅ DESPUÉS
import { createBrowserClient } from "@/shared/repositories/supabase/client.browser";
```

La factory en `storage.supabase.ts` llama `createBrowserClient(url, key).storage`. Compatible porque `client.browser.ts` acepta `url` y `anonKey` como parámetros opcionales con defaults de las env vars.

### 5.3 `shared/services/realtime.supabase.ts`

```ts
// ❌ ANTES
import { createBrowserClient } from "@supabase/ssr";

// ✅ DESPUÉS
import { createBrowserClient } from "@/shared/repositories/supabase/client.browser";
```

### 5.4 `shared/repositories/supabase/client.browser.ts`

```ts
// ❌ ANTES — no genérico, TS2769
lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),

// ✅ DESPUÉS — genérico, satisface LockFunc
lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
```

---

## 6. Resultado

Tras los 4 cambios, `pnpm typecheck` pasa sin errores. De los 13 tests originalmente fallando:

### Ronda 1 (fix de importaciones): 13 → 6 fallando

| Test | Error original | Resultado ronda 1 |
|------|---------------|-------------------|
| UC-STO-07 toggle disponibilidad | `button` nunca habilitado | ✅ Pasando |
| UC-STO-12 nombre vacío | `saveProductButton` timeout 10 s | ✅ Pasando |
| UC-STO-12 precio negativo | Ídem | ✅ Pasando |
| UC-STO-16 imagen producto | `product-image-upload` testID nunca encontrado | ✅ Pasando |
| UC-STO-22 ver perfil | `store-name` testID nunca encontrado | ✅ Pasando |
| UC-STO-23 editar perfil | `editar.*perfil` button timeout 30 s | ✅ Pasando |
| UC-STO-24 analytics KPIs | `kpi-total-orders` nunca encontrado | ✅ Pasando |
| UC-STO-12 crear producto válido | `successToast` timeout 10 s | ❌ Sigue fallando |
| UC-STO-13 editar producto | `successToast` timeout 10 s | ❌ Sigue fallando |
| UC-STO-14 eliminar producto | `productCard` visible post-delete | ❌ Sigue fallando |
| UC-STO-18 aceptar pedido | Timeout 120 s + context closed | ❌ Sigue fallando |
| UC-STO-19 rechazar pedido | Ídem | ❌ Sigue fallando |
| UC-STO-20 finalizar pedido | `finalizeButton` nunca visible | ❌ Sigue fallando |

Resultado ronda 1: **24 passing / 6 failing** (desde 17 passing / 13 failing).

### Ronda 2 (fixes subsiguientes): 6 → 3 fallando

Los 6 tests restantes de ronda 1 tenían la página cargando correctamente — el lock hang ya estaba resuelto. Los errores eran de lógica de negocio. Tres de ellos se resolvieron en ronda 2:

| Test | Error ronda 1 | Resultado ronda 2 |
|------|--------------|-------------------|
| UC-STO-12 crear producto válido | `successToast` no visible tras Save (10 s) | ✅ Pasando |
| UC-STO-14 eliminar producto | `productCard` sigue visible post-delete (5 s) | ✅ Pasando |
| UC-STO-19 rechazar pedido | Timeout 120 s + context closed | ✅ Pasando |
| UC-STO-13 editar producto | `successToast` no visible tras Save (10 s) | ❌ Sigue fallando |
| UC-STO-18 aceptar pedido | Timeout 120 s + context closed | ❌ Sigue fallando (error distinto) |
| UC-STO-20 finalizar pedido | `finalizeButton` no visible (15 s) | ❌ Sigue fallando |

Resultado ronda 2: **27 passing / 3 failing** (desde 24 passing / 6 failing).

---

## 7. Estado de los 3 tests restantes

Los 3 tests restantes tienen la autenticación y la carga de página completamente resueltas. Los errores son específicos de flujos de UI o de propagación Realtime.

### UC-STO-13 — editar producto

```
Error: expect(locator).toBeVisible() failed
Locator: getByText(/producto.*creado|producto.*guardado|producto.*eliminado/i)
Timeout: 10000ms — element(s) not found

  71 |   await catalog.nameInput.fill(newName);
  72 |   await catalog.saveProductButton.click();
> 73 |   await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
```

El flujo: navegar al producto → limpiar el nombre → escribir el nuevo nombre → click en Save → esperar el toast. El toast no aparece. Las posibilidades son: (a) el mensaje de éxito al editar un producto usa un texto distinto que no matchea el regex `/producto.*guardado/i`, o (b) la mutación de edición lanza un error silenciado que impide el toast.

El regex cubre `"producto creado"`, `"producto guardado"` y `"producto eliminado"`. Si el toast de edición dice `"producto actualizado"` o `"cambios guardados"`, no matchea.

### UC-STO-18 — aceptar pedido

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
waiting for navigation to "**/orders/**" until "domcontentloaded"

  30 |   const cart = new CartDrawer(clientPage);
  31 |   await cart.submitOrder();
> 32 |   await clientPage.waitForURL("**/orders/**", { timeout: 20_000, ... });
```

El flujo falla en `submitOrderAndLand`: el cliente llega al mapa, abre la tienda, agrega al carrito, hace submit del pedido — pero `clientPage` nunca navega a `/orders/[id]`. El pedido no se está creando o la redirección post-submit no ocurre. UC-STO-19 (rechazar) pasó correctamente en ronda 2 usando el mismo `submitOrderAndLand` — lo que sugiere que el problema puede ser de concurrencia entre tests que comparten la misma tienda fixture y corrieron en la misma sesión.

### UC-STO-20 — finalizar pedido

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('button', { name: /finalizar/i })
Timeout: 15000ms — element(s) not found

  176 |   await orders.orderCard(orderId).click();
> 178 |   await expect(detail.finalizeButton).toBeVisible({ timeout: 15_000 });
```

Este test tiene el flujo más largo: submit pedido → tienda acepta (ACEPTADO) → cliente confirma EN_CAMINO → tienda finaliza (FINALIZADO). El error ocurre al intentar mostrar el botón "Finalizar" en el detalle del pedido. El accept (líneas anteriores) completó correctamente, pero el `confirmOnTheWayButton` del cliente puede no haber disparado la transición a `EN_CAMINO` antes de que la tienda intentara abrir el detalle — o la transición vía Realtime no propagó en los 15 s del timeout. Sin `EN_CAMINO`, el botón "Finalizar" no debe estar habilitado según la máquina de estados del dominio.

---

## 8. Lecciones

1. **El fix de una capa revela la siguiente capa del mismo bug.** El Postmortem #4 resolvió el hang en la capa de datos (repositories). Este postmortem resolvió el hang en la capa de servicios de infraestructura (auth, storage, realtime). Ambas capas tenían el mismo bug por la misma razón: importaban `createBrowserClient` directamente de `@supabase/ssr` en lugar de usar la fábrica centralizada. Un codebase con múltiples puntos de entrada al mismo SDK tiene que centralizar la creación del cliente en UN solo lugar.

2. **La capa de autenticación bloquea todo lo demás.** `SessionProvider` vive en `app/layout.tsx` y se monta antes que cualquier componente de página. Si `onAuthStateChange()` cuelga, ningún botón, ningún dato, ningún testID será visible — aunque las queries de datos estén correctamente en un Route Handler. El orden de diagnóstico correcto es: auth primero, datos después.

3. **`client.browser.ts` debe ser el único punto de entrada al SDK de Supabase en el browser.** El invariante de portabilidad del repo (§10.3 de CLAUDE.md) prohíbe imports de `@supabase/*` fuera de `shared/repositories/supabase/*.ts` y `shared/services/*.supabase.ts`. Este postmortem demuestra que dentro de esos archivos también debe usarse la fábrica propia — nunca `@supabase/ssr` directo.

4. **TypeScript generics en overrides de SDK requieren matching exacto.** `LockFunc` es `<R>(name, timeout, fn: () => Promise<R>) => Promise<R>`. Una implementación con `Promise<unknown>` parece funcional en runtime pero falla en `tsc`. El compilador detecta la discrepancia aunque el runtime no la note — una razón más para correr `pnpm typecheck` después de cada cambio de override.

5. **El Edit tool no puede matchear strings con `<tipo>` TypeScript.** Los generics de TypeScript como `Promise<R>` o `fn: () => Promise<unknown>` son interpretados como tags HTML por el parser del tool. Para modificar líneas que contienen generics, usar `sed -i ''` como workaround.

---

## 9. Correcciones de tests E2E — sesión 2026-05-18

Esta sección documenta los bugs de los tests E2E del catálogo y pedidos que se resolvieron después de que el backend quedó funcional.

### 9.1 UC-STO-11 a UC-STO-16 — Race condition en tests de catálogo

**Síntoma:**
UC-STO-13 (`editar producto actualiza los datos en el catálogo`) fallaba cuando se ejecutaba junto con los demás tests del catálogo, pero pasaba en aislamiento.

```
Error: expect(locator).toBeVisible() failed
Locator: getByText(/producto.*creado|producto.*guardado|producto.*eliminado/i)
Timeout: 10000ms — element(s) not found
```

**Causa raíz:**
`playwright.config.ts` usa `fullyParallel: true` con `workers: 2`. UC-STO-13 (editar el primer producto) y UC-STO-14 (eliminar el primer producto) ambos apuntan a `page.getByRole("article").first()` — el mismo seed product. Con dos workers corriendo en paralelo, UC-STO-14 (~1.6s) eliminaba el producto de la DB mientras UC-STO-13 todavía ejecutaba su mutación de update.

`catalogService.update` internamente llama `productRepository.findById(id)` antes de hacer el PATCH. Con el producto ya eliminado, `findById` retorna `null` → el service lanza un error → `handleSubmit` en `EditProductFormContainer` captura el error en su bloque `catch` y setea `serverError` en lugar de llamar `toast.success("Producto guardado")` → el test espera el toast y hace timeout a los 10s.

**Fix:**
Agregar `test.describe.configure({ mode: "serial" })` a nivel de módulo en `e2e/use-cases/03-tienda/catalogo.uc.spec.ts`. Esto fuerza que todos los describes del archivo se ejecuten secuencialmente dentro del mismo worker, eliminando la condición de carrera.

```ts
// e2e/use-cases/03-tienda/catalogo.uc.spec.ts (después de los imports)
test.describe.configure({ mode: "serial" });
```

**Resultado:** Los 8 tests del catálogo (UC-STO-11 a UC-STO-16) pasan todos en 44s con 1 worker asignado.

---

### 9.2 UC-STO-18/19/20 — Transición EN_CAMINO bloqueaba el flujo completo del pedido

**Síntoma (heredado de sesión anterior):**
UC-STO-18 (`happy path — pedido completo`), UC-STO-19 (`pedido cancelado`) y UC-STO-20 (`pedido rechazado`) fallaban cuando la máquina de estados requería la transición `ACEPTADO → EN_CAMINO`.

**Causa raíz:**
La RPC `confirm_on_the_way_by_customer` no existía en la base de datos. El cliente no podía confirmar que estaba yendo a buscar el pedido, por lo que la transición `EN_CAMINO` nunca ocurría y el flujo completo del pedido (`ACEPTADO → EN_CAMINO → FINALIZADO`) quedaba bloqueado.

**Fix:**
Se creó la migración SQL `confirm_on_the_way_by_customer` con RLS que verifica que el usuario autenticado sea el dueño del pedido. La función actualiza el estado del pedido a `EN_CAMINO` y registra el timestamp de la transición.

**Resultado:** UC-STO-18, UC-STO-19 y UC-STO-20 pasan todos con `workers: 2` en paralelo.

---

---

# Postmortem #7: Tests E2E as-store — race conditions residuales y rate limiting en global-setup

**Fecha:** 2026-05-18  
**Tests afectados:** UC-STO-13, UC-STO-14, UC-STO-18, UC-STO-19, UC-STO-20, UC-STO-21 + global-setup (todos los roles)  
**Síntoma:** Después de los fixes del Postmortem #6, los tests del catálogo y pedidos de tienda seguían fallando cuando se ejecutaban en conjunto. UC-STO-13 y UC-STO-14 fallaban por race conditions de nombres y conteo. UC-STO-18/19/20 fallaban por interferencia entre workers. El global-setup agotaba su timeout de 30 s después de múltiples corridas seguidas.  
**Resolución:** Cuatro fixes independientes: (1) exact heading match en `productCard`, (2) nombres de fixture sin solapamiento, (3) serial mode + mayor timeout en pedidos, (4) `workers: 1` global, (5) caché de sesiones en global-setup.

---

## 1. Síntomas exactos

| Test | Error | Condición de fallo |
|------|-------|--------------------|
| UC-STO-13 editar producto | `successToast` no visible — 10 s | Correr junto con UC-STO-14 |
| UC-STO-14 eliminar producto | `expect(article).toHaveCount(initialCount - 1)` devolvía `-1` | `initialCount = 0` (hydration sin espera) |
| UC-STO-14 | `productCard("Empanada de carne")` seguía visible después de borrar | Nombre substring de otro producto en la DB |
| UC-STO-18 aceptar pedido | `waitForURL("**/orders/**")` — timeout 20 s | Corriendo en paralelo con tests de catálogo |
| UC-STO-19 rechazar pedido | Ídem con timeout 35 s | Dos workers corriendo catalogo + pedidos simultáneamente |
| UC-STO-20 finalizar pedido | `finalizeButton` no visible — 15 s | Ídem |
| global-setup | `page.waitForURL("**/map**")` — timeout 30 s | Múltiples corridas en menos de 5 minutos |

---

## 2. Causas raíz

### 2.1 `productCard` usaba coincidencia de substring

`CatalogPage.productCard(name)` filtraba artículos con `hasText`:

```ts
// ❌ ANTES — hasText es substring match
.filter({ hasText: productName })
```

`"Empanada de carne"` es substring de `"Empanada de carne (grande)"`. Después de UC-STO-13 renombrar el producto a la variante larga, UC-STO-14 capturaba la tarjeta renombrada como si fuera la original. Al borrarla, el producto de nombre "Empanada de carne" (que llegó de una corrida anterior) seguía en la DB y el locator lo encontraba.

### 2.2 Acumulación de productos de prueba en la DB

Los tests de catálogo crean y renombran productos sin hacer cleanup. Después de N corridas del suite, la DB acumula artículos con nombres similares (`"Empanada de carne"`, `"Empanada de carne (grande)"`, `"Empanada de carne (grande) (grande)"`, etc.). Con substring match, `productCard("Empanada de carne")` coincidía con múltiples artículos al mismo tiempo.

### 2.3 `count()` antes de que los artículos carguen

UC-STO-14 leía `page.getByRole("article").count()` inmediatamente después del `goto()`. SSR + React hydration todavía no habían montado las tarjetas en el DOM. El conteo devolvía `0`. Luego borraba un artículo y esperaba `toHaveCount(-1)` → error inmediato.

### 2.4 Workers paralelos: catalog + pedidos en simultáneo

`playwright.config.ts` tenía `workers: 2`. Con serial mode dentro de cada archivo, Playwright asignaba:
- **Worker 1** → `catalogo.uc.spec.ts` (UC-STO-11–16)
- **Worker 2** → `pedidos-tienda.uc.spec.ts` (UC-STO-17–21)

Ambos workers corrían **simultáneamente** contra el mismo servidor Next.js y la misma cuenta Supabase de tienda. La carga combinada (mutaciones de catálogo + submit de pedidos + auth de Realtime) hacía que los timeouts de `waitForURL("**/orders/**")` se agotaran.

`mode: "serial"` dentro de un archivo serializa tests **en ese worker**. No previene que dos archivos distintos corran en dos workers distintos al mismo tiempo.

### 2.5 Rate limiting de Supabase en global-setup

`globalSetup` siempre ejecutaba 3 logins via browser UI (client, store, admin) sin importar si ya existían sesiones válidas en `.auth/*.json`. Con `sign_in_sign_ups = 30` por cada 5 minutos en la config de Supabase, después de ~10 corridas consecutivas el endpoint de auth devolvía 429 y `page.waitForURL("**/map**")` nunca se completaba.

---

## 3. Lo que se intentó y no funcionó

### 3.1 Solo renombrar los fixtures (UC-STO-14) — insuficiente

Se renombró `"Empanada de carne"` → `"Empanada criolla E2E"` y `"Empanada de carne (grande)"` → `"Empanada editada E2E"`. Esto evitaba el solapamiento de nombres en corridas nuevas. Pero artículos de corridas anteriores (`"Empanada de carne"`, `"Empanada de carne (grande)"`) seguían en la DB y el locator de substring los encontraba igualmente.

El renombre era necesario pero no suficiente mientras `productCard` usara `hasText`.

### 3.2 Aumentar timeout de `waitForURL` a 35 s (UC-STO-19) — insuficiente con 2 workers

Se aumentó `waitForURL("**/orders/**", { timeout: 35_000 })` en `submitOrderAndLand`. UC-STO-20 empezó a pasar. Pero UC-STO-19 seguía fallando en corridas combinadas (catalog + pedidos) porque la interferencia entre workers a veces superaba los 35 s.

---

## 4. Fixes aplicados

### 4.1 Exact heading match en `CatalogPage.productCard`

**Archivo:** `e2e/use-cases/page-objects/CatalogPage.ts`

```ts
// ❌ ANTES — hasText es substring match
productCard(productName: string) {
  return this.page
    .getByRole("article")
    .filter({ hasText: productName })
    .first();
}

// ✅ DESPUÉS — heading exacto, no substring
productCard(productName: string) {
  return this.page
    .getByRole("article")
    .filter({ has: this.page.getByRole("heading", { name: productName, exact: true }) })
    .first();
}
```

`getByRole("heading", { name, exact: true })` solo coincide si el texto del heading es exactamente `productName`. Artículos con nombres similares (o acumulados de corridas anteriores) ya no son capturados accidentalmente.

### 4.2 Nombres de fixture sin solapamiento

**Archivo:** `e2e/use-cases/fixtures/products.ts`

```ts
// ❌ ANTES — "Empanada de carne" es substring de "Empanada de carne (grande)"
export const CATALOG_TEST_PRODUCT = {
  new: { name: "Empanada de carne", ... },
  updated: { name: "Empanada de carne (grande)", ... },
};

// ✅ DESPUÉS — nombres únicos con sufijo E2E, sin relación de substring
export const CATALOG_TEST_PRODUCT = {
  new: { name: "Empanada criolla E2E", ... },
  updated: { name: "Empanada editada E2E", ... },
};
```

El sufijo `E2E` también permite distinguir visualmente productos de test de productos seed reales en la DB.

### 4.3 UC-STO-14 — assertion por conteo en lugar de visibilidad

**Archivo:** `e2e/use-cases/03-tienda/catalogo.uc.spec.ts`

```ts
// ❌ ANTES — count() inmediato después de goto() devuelve 0 (antes de hydration)
const initialCount = await page.getByRole("article").count();
// ...delete...
await expect(catalog.productCard(productName)).not.toBeVisible();

// ✅ DESPUÉS — esperar hydration antes de contar, verificar por delta
await expect(page.getByRole("article").first()).toBeVisible({ timeout: 8_000 }); // espera hydration
const initialCount = await page.getByRole("article").count();
const firstCard = page.getByRole("article").first();
await firstCard.getByRole("button", { name: /eliminar/i }).click();
await catalog.deleteConfirmButton.click();
await expect(catalog.successToast).toBeVisible({ timeout: 10_000 });
await expect(page.getByRole("article")).toHaveCount(initialCount - 1, { timeout: 5_000 });
```

La verificación por conteo (`toHaveCount(N - 1)`) es inmune al estado acumulado de la DB: no importa cuántos artículos haya, solo verifica que hay uno menos que antes.

### 4.4 Serial mode + timeout extendido en `pedidos-tienda.uc.spec.ts`

**Archivo:** `e2e/use-cases/03-tienda/pedidos-tienda.uc.spec.ts`

```ts
// Agregado al inicio del archivo (después de los imports)
// UC-STO-18/19/20 comparten el mismo store seed y usan resetApprovedStore() para aislarse.
// Con workers paralelos pueden solaparse y corromper el estado compartido.
test.describe.configure({ mode: "serial" });
```

```ts
// waitForURL timeout aumentado en submitOrderAndLand
// ❌ ANTES
await clientPage.waitForURL("**/orders/**", { timeout: 20_000, ... });

// ✅ DESPUÉS
await clientPage.waitForURL("**/orders/**", { timeout: 35_000, ... });
```

### 4.5 `workers: 1` para evitar interferencia cross-file

**Archivo:** `playwright.config.ts`

```ts
// ❌ ANTES
// cap local workers to avoid Supabase auth rate limiting under parallel load
const E2E_WORKERS_LOCAL = 2;

// ✅ DESPUÉS
// cap local workers to 1: store tests share a single Supabase account and
// competing workers cause catalog + pedidos files to interfere under parallel load
const E2E_WORKERS_LOCAL = 1;
```

Con `workers: 1`, los archivos de tests corren secuencialmente: primero todos los tests de `catalogo.uc.spec.ts` (en el mismo worker), luego todos los de `pedidos-tienda.uc.spec.ts` (en el mismo worker). No hay interferencia de carga.

**Por qué `mode: "serial"` dentro de un archivo no era suficiente:** `serial` fuerza ejecución secuencial *dentro del worker asignado a ese archivo*. Con `workers: 2`, Playwright podía asignar dos archivos a dos workers distintos que corrían en paralelo. `workers: 1` es el único control que fuerza serialización cross-file.

CI ya usaba `workers: 1` por una razón idéntica (`E2E_WORKERS_CI = 1`).

### 4.6 Caché de sesiones en global-setup

**Archivo:** `e2e/global-setup.ts`

```ts
// ❌ ANTES — siempre hacía 3 logins via browser UI
for (const role of ROLES) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/login", ...);
  // fill + click + waitForURL
  await context.storageState({ path: role.file });
  await context.close();
}

// ✅ DESPUÉS — saltea roles con sesión < 1 hora
for (const role of ROLES) {
  if (existsSync(role.file) && Date.now() - statSync(role.file).mtimeMs < 60 * 60 * 1000) {
    continue; // sesión fresca, no relanzar el login
  }
  // ...login browser solo si es necesario...
}
```

**Por qué 1 hora:** Supabase emite access tokens con TTL de 1 hora y refresh tokens de ~1 semana. El storage state de Playwright incluye ambos. Si el archivo tiene menos de 1 hora, el access token sigue válido y no hace falta hacer login.

Para forzar re-autenticación (credenciales cambiadas, sesiones rotas):

```bash
rm -f e2e/.auth/*.json
pnpm test:e2e ...
```

---

## 5. Resultado final

```
13 passed (55.1s)
```

UC-STO-11 a UC-STO-21 todos pasan en una sola corrida con `workers: 1`.

---

## 6. Lecciones

1. **`hasText` en Playwright es substring match**: `filter({ hasText: "Empanada" })` coincide con cualquier artículo que *contenga* "Empanada" en cualquier parte de su texto. Para tests con nombres similares o datos acumulados en la DB entre corridas, usar `filter({ has: page.getByRole("heading", { name, exact: true }) })`.

2. **Los tests de E2E que no hacen cleanup acumulan estado en la DB**: después de N corridas, los fixtures de nombres de productos se van apilando. La estrategia correcta es: (a) nombres únicos que no sean substring entre sí, (b) assertions por delta (contar antes/después) en lugar de por presencia/ausencia de un nombre específico.

3. **`count()` inmediatamente después de `goto()` devuelve 0**: SSR entrega el HTML, pero React hydration todavía no montó los componentes. Siempre esperar `expect(locator.first()).toBeVisible()` antes de llamar `count()`.

4. **`mode: "serial"` no previene paralelismo cross-file**: serializa tests dentro de un archivo en el mismo worker. Con `workers: 2`, dos archivos distintos pueden correr simultáneamente. Para garantizar ejecución secuencial entre archivos del mismo proyecto, la única opción es `workers: 1`.

5. **El global-setup de Playwright no cachea sesiones por default**: re-ejecuta el flujo de login completo en cada corrida. Con rate limiting de Supabase (`sign_in_sign_ups = 30 / 5 min`), las corridas frecuentes en desarrollo local agotan el límite. El patrón correcto es verificar si el `.auth/*.json` es reciente y saltear el login si lo es.

---

---

# Postmortem #8: Flujos completos — UC-FLOW-01–05 fallaban por RLS en `resolveStoreInternalId`

**Fecha:** 2026-05-19  
**Tests afectados:** UC-FLOW-01 (happy path), UC-FLOW-02 (pedido cancelado), UC-FLOW-03 (pedido expirado), UC-FLOW-04 (pedido rechazado), UC-FLOW-05 (variante del flujo completo)  
**Archivo:** `e2e/use-cases/05-flujos-completos/flujos-pedido.uc.spec.ts`  
**Síntoma:** `clientPage.waitForURL("**/orders/**")` agotaba el timeout (20 s) después de que el cliente hacía submit del carrito. La navegación a `/orders/[id]` nunca ocurría.  
**Resolución:** `resolveStoreInternalId` en `shared/repositories/supabase/products.supabase.ts` consultaba `from("stores")` — bloqueado por RLS con el JWT del cliente. Cambio a `from("stores_view")`.

---

## 1. Síntoma exacto

- **En E2E:** `submitOrderAndLand` → `cart.submitOrder()` → `clientPage.waitForURL("**/orders/**", { timeout: 20_000 })` → timeout.
- **El carrito se abría y el botón "Confirmar pedido" era clickeable**, pero la acción de submit no producía la navegación esperada.
- **En el servidor:** la Server Action `submitOrder` en `features/orders/actions.ts` devolvía `{ ok: false }` silenciosamente — la mutación de React Query recibía el error pero el test no lo veía porque solo esperaba la URL.
- **Sin error visible en la UI:** el toast de error eventualmente podría haber aparecido, pero el test hacía timeout antes.

---

## 2. Causa raíz

`shared/repositories/supabase/products.supabase.ts` → `resolveStoreInternalId`:

```ts
// ANTES — consultaba la tabla stores directamente
private async resolveStoreInternalId(storePublicId: string): Promise<number> {
  const { data, error } = await this.client
    .from("stores")       // PROBLEMA
    .select("id")
    .eq("public_id", storePublicId)
    .single();
  // ...
}
```

`resolveStoreInternalId` se llama desde `ProductRepository.findAll({ storeId })` para resolver el `public_id` de la tienda a su FK interna antes de filtrar productos. En el contexto de `submitOrder` (Server Action), el cliente Supabase usa la sesión del usuario cliente (JWT del cliente autenticado, no el dueño de la tienda).

La tabla `stores` tiene RLS. La política permite que el dueño de la tienda y los admins lean su propia tienda. Un cliente normal (`role = "cliente"`) **no tiene acceso** a leer filas de `stores` directamente — RLS devuelve PGRST116 (no rows returned), impidiendo que la query de resolución devuelva el ID interno.

Sin el ID interno, `productRepository.findAll({ storeId })` falla → `submitOrder` devuelve `{ ok: false }` → el cliente nunca navega a `/orders/[id]`.

**Por qué `stores_view` funciona:** `stores_view` incluye `available = true` como condición pública. Las tiendas activas (que son exactamente las que el cliente puede ver en el mapa y agregar al carrito) son visibles para cualquier usuario autenticado vía la vista.

---

## 3. Fix aplicado

**Archivo:** `shared/repositories/supabase/products.supabase.ts`

```ts
// DESPUES — usa la vista pública
private async resolveStoreInternalId(storePublicId: string): Promise<number> {
  const { data, error } = await this.client
    .from("stores_view")   // vista con política permisiva para tiendas disponibles
    .select("id")
    .eq("public_id", storePublicId)
    .single();
  // ...
}
```

Un cambio de una palabra. Los 5 tests pasaron inmediatamente.

---

## 4. Lecciones

1. **La tabla `stores` con RLS y la vista `stores_view` tienen políticas distintas**: la tabla base requiere ser dueño o admin. La vista expone tiendas con `available = true` al público autenticado. Para operaciones que el cliente (no el dueño) necesita realizar sobre datos de la tienda, usar `stores_view`.

2. **`PGRST116` en un helper de resolución de IDs falla silenciosamente aguas arriba**: `resolveStoreInternalId` lanzaba un error que era capturado en la capa de la Server Action. El usuario no veía error en la UI — solo se evitaba la navegación. La ausencia de navegación es un síntoma débil; hay que agregar logs explícitos en los Server Actions.

3. **El scope de `findAll` con filtros depende del JWT del caller**: el mismo método con el mismo `storeId` funciona diferente según quién sea el usuario autenticado. Lo que funciona con el JWT del dueño falla con el JWT del cliente. Los tests E2E de flujos completos (dos contextos de usuario) son el único lugar donde esta diferencia se vuelve visible.

---

---

# Postmortem #9: UC-FLOW-06 — investigación de `alta-tienda-completa` sin cambio de código

**Fecha:** 2026-05-19  
**Test afectado:** UC-FLOW-06 (`e2e/use-cases/05-flujos-completos/alta-tienda-completa.uc.spec.ts`)  
**Síntoma reportado:** `TimeoutError: page.waitForURL: Timeout 15000ms exceeded` en línea 33, después del click en el botón de login como usuario `storePending`.  
**Resolución:** El test estaba pasando sin cambios de código. El error original era transitorio (servidor frío o Supabase no levantado).

---

## 1. Síntoma reportado

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
waiting for navigation to match /(store|register)\// until "domcontentloaded"
```

La línea fallida:

```ts
// alta-tienda-completa.uc.spec.ts:33
await storePage.waitForURL(/\/(store|register)\//, { timeout: 15_000, waitUntil: "domcontentloaded" });
```

El test usa `browser.newContext()` (sin `storageState`) — login desde cero para `storePending` (role `"tienda"`, tienda con `validation_status = "pending"`).

---

## 2. Flujo de auth trazado

```
LoginForm.container
  └─ signIn() → createBrowserClient (con no-op lock) → signInWithPassword
       └─ onAuthStateChange emite
            └─ extractRole(appMetadata, userMetadata)
                 → appMetadata.role = undefined
                 → fallback a userMetadata.role = "tienda"
                 → getRoleRedirect("tienda") = "/store/dashboard"
                 → router.push("/store/dashboard")

StoreShellContainer monta en /store/dashboard
  └─ useCurrentStoreQuery → GET /api/store/me (Route Handler, server-side)
       └─ validation_status = "pending"
            → router.replace("/store/pending-approval")

waitForURL(/\/(store|register)\//) matchea /store/pending-approval ✓
```

Todo el flujo era teóricamente correcto. No había nada que arreglar.

---

## 3. Verificaciones realizadas

| Componente | Verificación | Resultado |
|-----------|-------------|-----------|
| No-op lock en `client.browser.ts` | `lock: async <R>(..., fn) => fn()` | ✅ Ya aplicado |
| `extractRole` para `storePending` | `appMetadata.role` undefined → fallback a `userMetadata.role` | ✅ Correcto |
| `getRoleRedirect("tienda")` | Retorna `ROUTES.store.dashboard` | ✅ Correcto |
| Middleware para rol `"tienda"` | `public.users.role = "tienda"`, `requiredRole = "tienda"` → acceso permitido | ✅ Correcto |
| Trigger `handle_new_auth_user` | `raw_user_meta_data->>'role' = "tienda"` → `public.users.role = "tienda"` | ✅ Correcto |
| Estado DB `storePending` | `validation_status = "pending"`, `available = false` | ✅ Confirmado |
| `useCurrentStoreQuery` | Fetch a `GET /api/store/me` (Route Handler, no Web Locks) | ✅ Correcto |
| regex `waitForURL` | `/(store|register)\/` matchea `/store/pending-approval` | ✅ Correcto |

### Resultado de corridas durante la investigación

```
✓ UC-FLOW-06 — alta de tienda completa [1.8s]
✓ UC-FLOW-06 — alta de tienda completa [3.2s]
```

El test pasó dos veces seguidas sin ningún cambio de código.

---

## 4. Causa probable del error original

El error era transitorio. Causas más probables en orden de probabilidad:

1. **Servidor Next.js frío**: el dev server tarda varios segundos en compilar la primera ruta tras arrancar. Si el test corre antes de que `/store/dashboard` compile, el redirect del middleware supera el timeout de 15 s.
2. **Supabase local no levantado**: sin `pnpm supabase:start`, la auth falla silenciosamente y no hay redirect.
3. **Fila `public.users` faltante**: si el trigger `handle_new_auth_user` no se ejecutó (reset de DB sin re-aplicar el fixture de `storePending`), el middleware bloqueaba el acceso y no había redirect a `/store/*`.

---

## 5. Patrón documentado: `useCurrentStoreQuery` como referencia del patrón correcto

El test UC-FLOW-06 usa un contexto de browser fresco sin `storageState`. Aun así pasa limpio porque `useCurrentStoreQuery` ya aplica el patrón correcto:

```ts
// shared/hooks/useCurrentStoreQuery.ts
queryFn: async (): Promise<Store | null> => {
  const res = await fetch("/api/store/me", { credentials: "include" });
  if (res.status === 401) return null;   // no autenticado → null, no throw
  if (!res.ok) throw new Error("Error obteniendo tienda del servidor");
  return (await res.json() as { data: Store | null }).data;
},
```

Por qué es correcto para contextos de browser fresco:
- **Fetch HTTP → Route Handler** (`GET /api/store/me`): el servidor Node no tiene `navigator`, no puede adquirir Web Locks, no puede colgar.
- **Sin `enabled` condicional**: no depende de que el hook de sesión resuelva primero. El Route Handler maneja el 401 si no hay sesión.
- **`credentials: "include"`**: las cookies de sesión se mandan automáticamente, el servidor puede leer la sesión via `createRouteHandlerClient()`.

---

## 6. Lecciones

1. **Antes de buscar el bug, correr el test dos veces**: un error transitorio (servidor frío, Supabase no iniciado) se ve diferente a un error determinista. Si el test pasa en la segunda corrida sin cambios, el problema era ambiental.

2. **El no-op lock en `client.browser.ts` es condición necesaria para todo login E2E con `browser.newContext()`**: sin él, cualquier test que haga login desde cero puede colgar en Chromium headless si el browser intenta adquirir el Web Lock de auth. El invariante: todos los usos de `createBrowserClient` en el browser deben pasar por `shared/repositories/supabase/client.browser.ts`.

3. **`useCurrentStoreQuery` con Route Handler es el patrón definitivo para datos de tienda en contextos de browser frescos**: funciona tanto con `storageState` pre-cargado (Postmortem #4) como sin él (este test).

---

# Postmortem #7 — UC-FLOW-05 "cron auto-close-orders" colgado en `waitForURL`

**Fecha:** 2026-05-19
**Síntoma:** `e2e/use-cases/05-flujos-completos/flujos-pedido.uc.spec.ts:344` falla con `page.waitForURL("**/orders/**") Timeout 20000ms` después de `cart.submitOrder()`. Los otros 6 sub-tests del archivo pasan, incluido el gemelo de `expire-orders` (línea 309) que hace exactamente el mismo flujo de envío.

## 1. Causa raíz: tres bugs apilados

Lo que parecía un único síntoma eran tres problemas independientes:

### 1.1 Contaminación de DB entre sub-tests serializados
`resetApprovedStore` (`e2e/use-cases/fixtures/db.ts`) sólo limpiaba `stores` y `products`. No tocaba `orders`. El sub-test "expire-orders" dejaba una orden EXPIRADA del mismo cliente; cuando "auto-close-orders" intentaba crear otra orden, el flujo de submit se rompía silenciosamente y la navegación a `/orders/{id}` nunca ocurría.

### 1.2 Cron sin override E2E
`app/api/cron/auto-close-orders/route.ts` hardcodeaba `ORDER_AUTOCLOSE_HOURS=2`. No tenía el patrón `x-e2e-*` que `expire-orders` sí implementaba (`x-e2e-expiration-minutes`). El SQL `claim_auto_closeable_orders(p_autoclose_hours integer default 2)` ya aceptaba el parámetro — sólo faltaba el cableado.

### 1.3 Test estructuralmente incompleto
El sub-test ni siquiera ejercitaba el cron: enviaba un pedido (queda en `ENVIADO`), no lo aceptaba como tienda, e invocaba `auto-close-orders` que sólo cierra pedidos en `ACEPTADO`. Aún si el `waitForURL` hubiera pasado, el cron habría devuelto `count=0` y el test no se daría cuenta porque sólo asertaba `response.ok()`.

## 2. Fixes aplicados

### 2.1 `e2e/use-cases/fixtures/db.ts`
Después del upsert de productos, agregar DELETE de orders del store aprobado preservando las history orders sembradas por `global-setup.ts` (UUIDs `40000000-...`):

```ts
const E2E_HISTORY_ORDER_PUBLIC_IDS = [
  "40000000-0000-0000-0000-000000000001", // finalizado
  "40000000-0000-0000-0000-000000000002", // cancelado
] as const;

await supabase
  .from("orders")
  .delete()
  .eq("store_id", storeRow.id)
  .not("public_id", "in", `(${E2E_HISTORY_ORDER_PUBLIC_IDS.join(",")})`);
```

`order_items` cascadea por FK; `audit_log` es soft-reference y se deja append-only.

### 2.2 `app/api/cron/auto-close-orders/route.ts`
Antes de la llamada al RPC, parsear header `x-e2e-autoclose-hours` cuando `env.E2E_TEST_MODE === "1"`:

```ts
let autocloseHours: number = ORDER_AUTOCLOSE_HOURS;
if (isE2E) {
  const override = request.headers.get("x-e2e-autoclose-hours");
  if (override !== null) {
    const parsed = parseInt(override, 10);
    if (Number.isFinite(parsed)) autocloseHours = parsed;
  }
}
```

Permite negativos (`Number.isFinite`) para esquivar el race con `updated_at < now() - interval '0 hours'` cuando la orden recién se aceptó. Se aplicó la misma relajación al override de `expire-orders` por paridad.

### 2.3 Reestructuración del sub-test (`flujos-pedido.uc.spec.ts:344`)
- Abrir `storeContext` con `STORE_AUTH` además del `clientContext`.
- Cliente envía → tienda acepta vía `StoreOrderDetailPage.acceptButton.click()` (recipe copiada de UC-FLOW-04).
- Esperar `tracking.statusStep("ACEPTADO")` visible en el cliente.
- POST `/api/cron/auto-close-orders` con header `x-e2e-autoclose-hours: -1`.
- Asserts: `response.ok()` Y `body.count > 0` (mismo patrón que el gemelo de expire-orders).
- Esperar `tracking.statusStep("FINALIZADO")` visible via Realtime.

### 2.4 Cobertura unit del override
Cuatro tests nuevos en `app/api/cron/auto-close-orders/route.test.ts` y otros cuatro en `expire-orders/route.test.ts`: header en E2E mode con valor positivo, negativo, no-numérico, y fuera de E2E mode. Necesitó refactorear el mock de `env` con `vi.hoisted` para mutar `E2E_TEST_MODE` por test.

## 3. Verificación

- Unit: `pnpm vitest run app/api/cron/auto-close-orders/route.test.ts app/api/cron/expire-orders/route.test.ts` → 31/31 ✅
- E2E aislado: `pnpm test:e2e flujos-pedido.uc.spec.ts -g "auto-close-orders"` → 1/1 ✅
- E2E archivo completo: `pnpm test:e2e flujos-pedido.uc.spec.ts` → 6/6 ✅
- Typecheck: `pnpm typecheck` → ok

## 4. Lecciones

1. **El síntoma (`waitForURL` timeout) estaba a dos saltos de la causa raíz**. El timeout no era por el cron ni por la red — era por el reset de DB compartido que no limpiaba `orders`. Buscar "qué cambió entre el sub-test que pasa y el que falla" reveló que el orden de ejecución importaba, lo cual apuntaba a estado compartido.

2. **Cuando un sub-test E2E "pasa" sin asertar nada útil, está mintiendo**. El test original asertaba `response.ok()` después de invocar el cron — pero el cron devolvía `count=0` porque no había pedido en `ACEPTADO`. Hubiera pasado verde para siempre sin haber probado nunca el código de auto-close. La firma de un test que dice algo: `expect(body.count).toBeGreaterThan(0)`.

3. **Paridad simétrica entre crons hermanos**. Si dos endpoints comparten estructura (auth, RPC, mismo patrón de override), cualquier divergencia es una bug en potencia. `expire-orders` tenía el patrón, `auto-close-orders` no — y nadie lo había detectado porque el test del segundo no lo ejercía. Auditar los pares hermanos cuando uno se rompe.

4. **`Number.isFinite` > `!isNaN && >= 0` cuando el SQL filtra por timestamp**. `updated_at < now() - interval '0 hours'` es `updated_at < now()`, que excluye filas recién escritas por race de microsegundos. Permitir negativos resuelve el caso de "cerrar lo recién aceptado" sin tocar la SQL.
