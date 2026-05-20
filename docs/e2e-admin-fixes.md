# E2E Admin — Diagnóstico y correcciones

**Fecha:** 2026-05-18  
**Tests afectados:** `e2e/use-cases/04-admin/`  
**Resultado:** 11 failing → 8 passing (3 pendientes)

Este documento explica con detalle las causas raíz de cada falla, qué se modificó para corregirlas, y los patrones que pueden reaparecer en otros test suites.

---

## Índice

1. [Causa A — Web Locks API hang (Moderación)](#causa-a--web-locks-api-hang-moderación)
2. [Causa B — stores_view + is_admin() + service role (Tiendas)](#causa-b--stores_view--is_admin--service-role-tiendas)
3. [Causa C — Confirm button disabled sin reason (Usuarios)](#causa-c--confirm-button-disabled-sin-reason-usuarios)
4. [Errores pendientes (3 tests)](#errores-pendientes-3-tests)
5. [Resumen de patrones a vigilar](#resumen-de-patrones-a-vigilar)

---

## Causa A — Web Locks API hang (Moderación)

### Tests afectados
- `UC-ADM-12` — cola de moderación carga reportes  
- `UC-ADM-13` — desestimar reporte  
- `UC-ADM-14` — eliminar contenido reportado

### Síntoma

Los tests colgaban indefinidamente. El navegador cargaba la página `/admin/moderation` pero el contenido nunca aparecía. Playwright agotaba el timeout (usualmente 30 s) sin error de red visible — el fetch simplemente nunca resolvía.

### Causa raíz

`features/content-moderation/services/content-moderation.adapter.ts` tenía esta línea a nivel de **módulo** (fuera de cualquier función):

```ts
// ❌ ANTES — nivel de módulo, se ejecuta al importar el archivo
const _client = isMock ? null : createBrowserClient();
```

`createBrowserClient()` de `@supabase/ssr` llama internamente a `navigator.locks.request()` cuando detecta que está en un contexto de navegador. En el flujo de hard navigation (first load / SSR import), esta llamada se queda esperando un lock que nunca se libera, **bloqueando toda ejecución asíncrona** del módulo. El resultado es que cualquier hook que importara este adapter jamás resolvía su promesa.

#### Por qué ocurre esto

La Web Locks API está diseñada para coordinar acceso a recursos entre tabs/workers. El SDK de Supabase auth-js v2 usa locks para serializar el refresco de sesión y evitar race conditions entre tabs. Si se llama desde fuera de un event loop activo (por ejemplo, al parsear un módulo durante SSR o durante la primer hidratación antes de que el browser haya terminado de inicializar sus APIs), el lock nunca se concede → el `await navigator.locks.request()` nunca resuelve.

### Archivos modificados

#### 1. `features/content-moderation/hooks/useReportsQuery.ts`

**Antes** — invocaba el adapter que contenía el client a nivel de módulo:
```ts
// ❌ ANTES
import { contentModerationService } from "@/features/content-moderation/services/content-moderation.adapter";

async function fetchPendingReports(): Promise<readonly Report[]> {
  return contentModerationService.listReports({ status: REPORT_STATUS.PENDING });
}
```

**Después** — llama a un Route Handler via `fetch`:
```ts
// ✅ DESPUÉS
async function fetchPendingReports(): Promise<readonly Report[]> {
  const status = encodeURIComponent(REPORT_STATUS.PENDING);
  const res = await fetch(`/api/admin/reports?status=${status}`, { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `fetchPendingReports: ${res.status}`);
  }
  const body = (await res.json()) as { data: Report[] };
  return body.data;
}
```

#### 2. `features/content-moderation/hooks/useDismissReportMutation.ts`

**Antes** — usaba el adapter directamente:
```ts
// ❌ ANTES
mutationFn: async (reportId: string) => {
  await contentModerationService.dismissReport(reportId);
}
```

**Después** — llama a un Server Action:
```ts
// ✅ DESPUÉS
mutationFn: async (reportId: string) => {
  const result = await dismissReportAction(reportId);
  if (!result.ok) throw new Error(result.error);
}
```

#### 3. `features/content-moderation/hooks/useRemoveContentMutation.ts`

Mismo cambio que `useDismissReportMutation`. Reemplaza `contentModerationService.removeContent()` por `removeContentAction()`.

**Nota adicional:** La versión inicial de ambos hooks importaba `serverLogger` para logear errores. `serverLogger` tiene `import "server-only"` en su implementación, lo que hace que el build falle si se importa desde código cliente. Se eliminó — los hooks client-side no necesitan server logger.

#### 4. `app/api/admin/reports/route.ts` (NUEVO ARCHIVO)

Route Handler creado para servir la lista de reportes. Patrón:

```ts
import "server-only";

export async function GET(request: Request): Promise<NextResponse> {
  // 1. Autenticar con createRouteHandlerClient() (usa cookies del request)
  const authClient = await createRouteHandlerClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError !== null || user === null) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  // 2. Verificar is_admin() con el cliente autenticado (no con service role)
  const { data: isAdmin, error: adminError } = await authClient.rpc("is_admin");
  if (adminError !== null) { return /* 500 */ }
  if (!isAdmin) { return /* 403 */ }

  // 3. Queries reales con createServiceRoleClient() (bypassa RLS)
  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = createSupabaseContentModerationService(client);
  const reports = await service.listReports({ status });
  return NextResponse.json({ data: reports });
}
```

#### 5. `features/content-moderation/server-actions/content-moderation-actions.ts` (NUEVO ARCHIVO)

Server Actions para las mutaciones de moderación. Patrón idéntico al Route Handler: `ensureAdmin()` con `createRouteHandlerClient()` → datos con `createServiceRoleClient()`:

```ts
"use server";
import "server-only";

async function ensureAdmin(): Promise<ModerationActionResult> {
  const client = await createRouteHandlerClient();
  const { data: { user } } = await client.auth.getUser();
  // ...
  const { data: isAdmin } = await client.rpc("is_admin");
  // ...
}

export async function dismissReportAction(reportId: string): Promise<ModerationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };
  const service = buildService(); // usa createServiceRoleClient()
  await service.dismissReport(reportId);
  return { ok: true };
}
```

### Patrón a vigilar en otros tests

**Síntoma en E2E:** test cuelga sin timeout de red visible. La página carga pero los datos nunca aparecen.

**Causa probable:** algún service/adapter crea un Supabase browser client a nivel de módulo (`const client = createBrowserClient(...)` fuera de cualquier función).

**Solución:** mover el data fetching a:
- **Reads** → Route Handler (`app/api/.../route.ts`) llamado via `fetch()` desde el hook
- **Mutations** → Server Action (`"use server"` + `"server-only"`) importado en el hook

Nunca crear `createBrowserClient()` en el scope de módulo de un adapter o service que sea importado directamente en hooks de React.

---

## Causa B — stores_view + is_admin() + service role (Tiendas)

### Tests afectados
- `UC-ADM-02` — ver tiendas pendientes de validación  
- `UC-ADM-03` — buscar tienda por nombre  
- `UC-ADM-04` — ver detalle de tienda pendiente  
- `UC-ADM-05` — aprobar tienda

### Síntoma

La lista de tiendas pendientes aparecía vacía aunque existieran tiendas con `validation_status = 'pending'` en la base de datos. El tab "Pendientes" no mostraba ninguna fila.

### Causa raíz

La capa de datos de validación consultaba la vista `stores_view` con un cliente de service role:

```ts
// ❌ ANTES — usaba stores_view
const { data, error } = await this.client
  .from("stores_view")  // ← PROBLEMA
  .select(VALIDATION_SELECT)
  .eq("validation_status", status);
```

`stores_view` tiene una cláusula `WHERE` con un security barrier:

```sql
-- Definición interna de stores_view (simplificada)
SELECT ...
FROM stores s
WHERE
  s.available = true
  OR s.owner_id = (select auth.uid())
  OR (select public.is_admin())   -- ← esta condición siempre es FALSE con service role
```

Con `createServiceRoleClient()` no hay sesión de usuario autenticado — el contexto de JWT es el del service role, no de ningún usuario. Cuando PostgREST evalúa `(select public.is_admin())`, la función internamente llama `auth.uid()` que devuelve `NULL`. Sin UID, `is_admin()` devuelve `false`.

Resultado: la condición `OR (select public.is_admin())` siempre falla con service role, y las tiendas con `available = false` (que son las pendientes, que por definición no están disponibles al público) son invisibles a la query.

### Archivo modificado

**`features/store-validation/services/store-validation.supabase.ts`**

Cambios:
1. Reemplazar consulta a `stores_view` por consulta directa a `stores`
2. Obtener `owner_public_id` via embedded join en PostgREST usando la FK explícita
3. Adaptar el mapper al nuevo shape de fila

#### Select string — antes vs. después

```ts
// ❌ ANTES — consulta la vista que filtra con is_admin()
const VALIDATION_SELECT = "id, public_id, name, ...";
// from("stores_view")

// ✅ DESPUÉS — consulta la tabla directamente con join explícito
const VALIDATION_SELECT =
  "id, public_id, name, description, category, available, " +
  "photo_url, tagline, price_from_ars, hours, cuit, " +
  "validation_status, rejection_reason, created_at, " +
  "users!stores_owner_id_fkey(public_id)";
// from("stores")
```

El truco del embedded join `users!stores_owner_id_fkey(public_id)`:
- `users` es la tabla relacionada
- `!stores_owner_id_fkey` es el nombre exacto de la FK constraint (necesario cuando hay múltiples FK hacia `users` desde `stores`, para que PostgREST sepa cuál usar)
- `(public_id)` es la columna que queremos del join

#### Tipo e interfaz — antes vs. después

```ts
// ❌ ANTES — shape de stores_view (incluía lat/lng calculados por PostGIS)
interface DbValidationStoreRow {
  readonly id: number;
  readonly public_id: string;
  // ... campos del owner venían como owner_public_id (column alias de la view)
  readonly lat: number | null;
  readonly lng: number | null;
}

// ✅ DESPUÉS — shape directo de stores con join
interface DbStoreDirectRow {
  readonly id: number;
  readonly public_id: string;
  readonly users: { readonly public_id: string } | null; // ← resultado del join
  // lat/lng no existen en stores (son calculados por PostGIS en la view)
}
```

#### Métodos actualizados

```ts
// ✅ DESPUÉS — ambos métodos usan "stores" directamente
async getStoresByStatus(status: ValidationStatus): Promise<readonly PendingStore[]> {
  const { data, error } = await this.client
    .from("stores")           // ← era "stores_view"
    .select(VALIDATION_SELECT)
    .eq("validation_status", status)
    .order("created_at", { ascending: true });

  if (error !== null) throw new Error(`getStoresByStatus: ${error.message}`);
  return (data as unknown as DbStoreDirectRow[]).map(mapStoreDirectRow);
}

async getStoreById(id: string): Promise<PendingStore | null> {
  const { data, error } = await this.client
    .from("stores")           // ← era "stores_view"
    .select(VALIDATION_SELECT)
    .eq("public_id", id)
    .maybeSingle();

  if (error !== null) throw new Error(`getStoreById: ${error.message}`);
  if (data === null) return null;
  return mapStoreDirectRow(data as unknown as DbStoreDirectRow);
}
```

#### Mapper actualizado

```ts
function mapStoreDirectRow(row: DbStoreDirectRow): PendingStore {
  return {
    id: row.public_id,
    ownerId: row.users?.public_id ?? "",  // ← antes era row.owner_public_id
    name: row.name,
    description: row.description ?? undefined,
    kind: dbCategoryToKind(row.category),
    status: row.available ? "open" : "closed",
    photoUrl: row.photo_url ?? PLACEHOLDER_STORE_PHOTO_URL,
    tagline: row.tagline ?? "",
    priceFromArs: row.price_from_ars !== null ? Number(row.price_from_ars) : 0,
    hours: row.hours ?? undefined,
    cuit: row.cuit ?? undefined,
    validationStatus: row.validation_status as ValidationStatus,
    rejectionReason: row.rejection_reason ?? undefined,
    location: null,       // ← PostGIS no disponible fuera de la view; admin no lo necesita
    distanceMeters: 0,
  };
}
```

### Patrón a vigilar en otros tests

**Síntoma en E2E:** lista vacía o elementos no encontrados, aunque los datos existen en la DB.

**Causa probable:** una vista SQL con RLS o condiciones basadas en `auth.uid()` / `is_admin()` se usa con el service role client.

**Regla:** cuando el backend usa `createServiceRoleClient()` para bypasear RLS, **no puede consultar vistas que internamente llamen `auth.uid()` o `is_admin()`** — esas funciones devuelven NULL/false con service role porque no hay JWT de usuario en el contexto.

**Solución:** consultar la tabla base directamente y usar embedded joins de PostgREST (`tabla!fk_constraint_name(columna)`) para traer datos de tablas relacionadas.

**Cómo identificar el FK constraint name** cuando hay múltiples FK desde una tabla a otra:
```sql
-- Consultar en Supabase SQL editor:
SELECT constraint_name, column_name, foreign_table_name
FROM information_schema.key_column_usage
WHERE table_name = 'stores' AND constraint_name LIKE '%fkey%';
```

---

## Causa C — Confirm button disabled sin reason (Usuarios)

### Test afectado
- `UC-ADM-10` — suspender usuario muestra badge de suspendido (parcialmente)

### Síntoma

El test hacía clic en "Suspender" y luego inmediatamente en "Sí, suspender" — el botón de confirmación nunca respondía. El badge "Suspendido" no aparecía.

### Causa raíz

`SuspendConfirmDialog` tiene validación de longitud mínima en el campo "Motivo de la suspensión":

```ts
// features/user-management/components/SuspendConfirmDialog/SuspendConfirmDialog.tsx
const REASON_MIN_CHARS = 3;
const canConfirm = !isPending && reason.trim().length >= REASON_MIN_CHARS;

<Button disabled={!canConfirm} onClick={handleConfirm}>
  Sí, suspender
</Button>
```

El botón está **deshabilitado** hasta que el textarea tenga al menos 3 caracteres. El test original hacía clic en él sin llenar el campo → clic sobre un `disabled` button → sin efecto → timeout esperando el badge.

### Archivos modificados

#### 1. `e2e/use-cases/page-objects/AdminPages.ts`

Agregado locator `suspendReasonInput`:

```ts
get suspendReasonInput(): Locator {
  return this.page.getByLabel(/motivo.*suspensión/i);
}
```

El label exacto en el componente es "Motivo de la suspensión" con id `suspend-reason`. El regex `/motivo.*suspensión/i` lo resuelve de forma flexible.

#### 2. `e2e/use-cases/04-admin/usuarios.uc.spec.ts`

Agregado `fill()` antes de hacer clic en confirmar:

```ts
// ✅ DESPUÉS
await users.suspendButton.click();
await users.suspendReasonInput.fill("Comportamiento abusivo");  // ← NUEVO
await users.confirmSuspendButton.click();
await expect(users.suspendedBadge).toBeVisible({ timeout: 8_000 });
```

### Patrón a vigilar en otros tests

**Síntoma en E2E:** clic en botón de acción destructiva (suspender, rechazar, eliminar, confirmar) sin efecto. El test falla esperando el resultado de la acción.

**Causa probable:** el botón tiene `disabled={!canConfirm}` o similar condicionado a un campo de texto o checkbox que el test no llenó.

**Regla:** siempre que un flujo destructivo tenga un dialog de confirmación, verificar si requiere texto de motivo/reason antes de habilitar el botón de confirmación. Leer el componente del dialog antes de escribir el test.

**Confirmadores con campos requeridos en este proyecto (al 2026-05-18):**
| Componente | Campo | Min. chars |
|---|---|---|
| `SuspendConfirmDialog` | "Motivo de la suspensión" | 3 |
| `RejectStoreDialog` (en el detail de tienda) | "Motivo del rechazo" | depende de validación zod |

---

## Errores pendientes (3 tests)

### UC-ADM-10 — `suspendedBadge` no aparece

**Estado:** el `suspendReasonInput.fill()` funciona, el botón de confirmación ya no está disabled, pero `getByText(/suspendido/i)` no se hace visible dentro de 8 s.

**Hipótesis probable:**  
1. La mutación de suspensión falla silenciosamente en el backend (RLS, permisos de service role, campo requerido no enviado)  
2. El badge "Suspendido" no está en el DOM en ese momento — puede ser que la UI actualice el estado localmente pero con otro texto, o que haya un problema de invalidación de React Query  

**Próximos pasos para diagnosticar:**  
- Agregar `page.on('response', ...)` en el test para capturar la respuesta del endpoint de suspensión  
- Verificar que el locator `getByText(/suspendido/i)` coincida con el texto exacto del badge en el componente de detalle de usuario

---

### UC-ADM-06 — `viewStoreButton` / `rejectButton` no encontrados

**Estado:** los 2 sub-tests de rechazo de tienda fallan porque no encuentran el botón "Ver / detalle" en la lista o el botón "Rechazar tienda" en el detalle.

**Causa probable — test isolation rota:**  
`UC-ADM-05` (aprobar tienda) **corre antes** de `UC-ADM-06` (rechazar tienda) y **cambia el estado de la tienda** de `pending` → `approved` en la misma base de datos compartida. Cuando `UC-ADM-06` busca la tienda en el tab "Pendientes", ya no está ahí — fue aprobada por el test anterior.

Los tests comparten la base de datos de E2E (no hay rollback entre tests). La tienda del fixture `E2E_STORES.pending` queda con `validation_status = 'approved'` tras UC-ADM-05, y UC-ADM-06 no la encuentra en la pestaña Pendientes.

**Solución requerida (no implementada aún):**  
Opción A (preferida): cada test de UC-ADM-06 debe usar `beforeEach` para resetear el `validation_status` de la tienda de fixture a `'pending'` via API interna o SQL directo.  
Opción B: re-ordenar los tests para que UC-ADM-06 (rechazar) corra **antes** de UC-ADM-05 (aprobar). Pero esto es frágil — si alguna vez el orden cambia, vuelve a romperse.  
Opción C: crear una tienda de fixture dedicada para cada test (seed por test, teardown por test).

---

### `ModerationQueue.container.test.tsx` — unit test falla

**Estado:** test de componente (vitest) falla con `NEXT_PUBLIC_APP_URL: Required`.

**Causa:** la refactorización de `useDismissReportMutation` y `useRemoveContentMutation` ahora importa `content-moderation-actions.ts`, que importa `@/shared/config/env`. El schema de env con Zod valida `NEXT_PUBLIC_APP_URL` al parsear. En el entorno vitest, esa variable no está seteada → falla al importar.

**Solución requerida (no implementada aún):**  
1. Agregar `NEXT_PUBLIC_APP_URL=http://localhost:3000` al `.env.test` (o `vitest.config.ts`)  
2. O bien, mockear el módulo de server actions en el test: `vi.mock("@/features/content-moderation/server-actions/content-moderation-actions")`  
3. O bien, mockear el hook directamente en el test del container con `vi.mock("@/features/content-moderation/hooks/useDismissReportMutation")`

---

## Resumen de patrones a vigilar

| Patrón | Síntoma E2E | Causa | Fix |
|---|---|---|---|
| `createBrowserClient()` a nivel de módulo | Test cuelga, datos nunca cargan | Web Locks API hang en primera carga | Mover a Route Handler + Server Action |
| Vista SQL con `is_admin()` usada con service role | Lista vacía, rows no encontradas | `auth.uid()` retorna NULL con service role | Consultar tabla directa con embedded join |
| Dialog de confirmación destructiva con campo requerido | Clic sin efecto, timeout esperando resultado | Botón `disabled` hasta que textarea tenga mínimo chars | `fill()` el campo reason antes de confirmar |
| Tests que mutan estado compartido sin rollback | Tests posteriores fallan por datos incorrectos | Ausencia de aislamiento / teardown | Seed + reset por test, o reordenar |
| Server Action importada en test sin env vars | Unit test falla al importar con `Required` | Zod env schema valida al parsear | Agregar vars en `.env.test` o mockear el módulo |
