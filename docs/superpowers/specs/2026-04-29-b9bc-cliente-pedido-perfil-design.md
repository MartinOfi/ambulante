# Design — B9-B + B9-C: Cliente pedido completo + push opt-in + perfil

> **Fecha:** 2026-04-29
> **Tareas del epic:** [`B9-B`](../../epic-backend/tasks/B9-B.md) + [`B9-C`](../../epic-backend/tasks/B9-C.md)
> **Owner:** chat-2026-04-29
> **Estado:** approved (brainstorming) → pending implementation

## Contexto

Fase B9 del epic backend (Swap cliente). Las dos tareas se ejecutan en un único worktree porque comparten contexto de cliente y muchas dependencias internas. B9-A ya está ✅, así que el repo tiene auth real, mapa, y store-detail consumiendo backend real. Lo que falta es el **ciclo del pedido del lado cliente** (B9-B) y el **opt-in de push + edición de perfil** (B9-C).

El carácter del trabajo es **mayormente swap de mocks a backend real**: muchos hooks y componentes ya existen apuntando a `orders.mock.ts` o a localStorage. La feature `order-flow` no existe todavía y se crea desde cero como contenedor de las Server Actions.

## Decisiones de brainstorming (resumen)

| Decisión | Elegido | Alternativa descartada |
|---|---|---|
| Worktrees | Un solo worktree para B9-B + B9-C | Dos worktrees secuenciales (recomendado por protocolo, descartado por usuario) |
| Path de actions | Híbrido: `features/order-flow/actions.ts` (submit) + `features/orders/actions.ts` (cancel) | Todo en `features/orders/`; o todo en `order-flow/` |
| Estrategia de tests | Vitest unit + integration vs Supabase local + 1 Playwright E2E happy path | Sólo unit (riesgoso); o exhaustivo E2E (overkill) |
| Split B9-B | Sin split — atacar entera, monitoreando budget de líneas | Split B9-B1 (cart/submit/cancel) + B9-B2 (tracking/history) |
| Scope B9-C | Push opt-in + `display_name` + avatar; **sin** idioma, **sin** notif prefs en DB | Notif prefs en DB; columna `users.language` |

## Arquitectura

### Mapa de archivos

```
features/order-flow/                          ← NUEVO (no existe el dir)
  ├── actions.ts                              ← submitOrder Server Action
  ├── actions.test.ts                         ← integration vs Supabase local
  ├── schemas.ts                              ← Zod input schemas
  └── index.ts                                ← barrel

features/orders/
  ├── actions.ts                              ← NUEVO: cancelOrder Server Action
  ├── actions.test.ts                         ← integration
  ├── hooks/
  │   ├── useOrderHistory.ts                  ← NUEVO: keyset pagination via useInfiniteQuery
  │   ├── useOrderHistory.test.ts
  │   ├── useSendOrderMutation.ts             ← SWAP interno (firma pública estable; mutationFn pasa de mock service a llamar submitOrder Server Action)
  │   └── useCancelOrderMutation.ts           ← SWAP interno (firma estable; llama cancelOrder Server Action)
  ├── components/
  │   ├── OrderHistoryScreen/                 ← SWAP container a useOrderHistory real
  │   ├── OrderTracking/                      ← SWAP container a hooks reales
  │   └── (resto sin cambio)
  └── services/orders.mock.ts                 ← ELIMINAR al cierre (con grep previo)

features/profile/
  ├── actions.ts                              ← NUEVO: updateProfile
  ├── actions.test.ts
  ├── hooks/
  │   ├── usePushSubscribe.ts                 ← NUEVO
  │   ├── usePushSubscribe.test.ts
  │   ├── useUpdateProfileMutation.ts         ← NUEVO
  │   └── useUpdateProfileMutation.test.ts
  └── components/
      ├── ProfilePage/                        ← SWAP a container con datos reales
      ├── PushOptInToggle/                    ← NUEVO
      ├── DisplayNameField/                   ← NUEVO
      └── AvatarUpload/                       ← NUEVO
```

**Repos / facades nuevos:** ninguno. Todo lo que se necesita ya existe (`orders.supabase.ts`, `products.supabase.ts`, `push-subscriptions.supabase.ts`, `users.supabase.ts`, `push.supabase.ts`, `storage.supabase.ts`).

### Migraciones DB

**Verificación previa al iniciar (en setup del worktree):**

1. ¿Existen `users.display_name` y `users.avatar_url`? → si sí, **0 migraciones**.
2. ¿Existe el bucket `avatars` con RLS? → si sí, **0 migraciones**.

Si falta algo, se crea **una sola migración** `20260429xxxxxx_b9c_users_profile_fields.sql`:
- `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;`
- `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;`
- Bucket `avatars` con policies RLS (read public, write auth.uid() === filename prefix).

## Data flow

### submitOrder (B9-B)

Server Action en `features/order-flow/actions.ts`. Atomicidad y skill rules `lock-short-transactions` + `data-batch-inserts` aplican.

```
Cliente UI (CartReviewPage container)
  ↓ Zod parse(submitOrderInput)
useSendOrderMutation (React Query mutation)
  ↓
submitOrder({ customerId, storeId, items, notes? })
  1. Auth: assert auth.uid() === customerId (sino → 401)
  2. BEGIN
  3. SELECT id, name, price_cents FROM products
     WHERE id = ANY($1) AND deleted_at IS NULL FOR SHARE
     - Si count(rows) !== input.items.length → reject "producto no disponible"
  4. INSERT INTO orders (customer_id, store_id, status='ENVIADO', total_cents, notes, ...)
     RETURNING id, public_id
  5. INSERT INTO order_items (order_id, product_id, name_snapshot, price_cents_snapshot, qty)
     VALUES (...) -- batch single statement, skill rule data-batch-inserts
  6. COMMIT
  7. emitDomainEvent('OrderCreated', { orderId, customerId, storeId })  -- post-commit
  8. return { publicId, status: 'ENVIADO' }
  ↓
React Query invalidates ['orders', customerId] + redirect /orders/{publicId}
```

**Reglas de la state machine (§7.1 PRD):** sólo el cliente dispara `ENVIADO`. La RLS policy de `orders` insert ya enforza `customer_id = auth.uid()` (B2.1). El campo `status` se setea en el INSERT, sin trigger.

### cancelOrder (B9-B)

Server Action en `features/orders/actions.ts`.

```
Cliente UI (CancelOrderButton dentro de OrderTracking)
  ↓
useCancelOrderMutation
  ↓
cancelOrder({ orderId, reason? })
  1. Auth: assert user is customer of this order
  2. SELECT status FROM orders WHERE id=$1 AND customer_id=auth.uid() FOR UPDATE
     - row not found → 404 (RLS también deny si no es el customer)
  3. State machine: status ∈ ['ENVIADO', 'RECIBIDO'] → ok
                    status ∈ ['ACEPTADO', 'EN_CAMINO'] → reject "no podés cancelar después de aceptado"
                    status terminal → reject "este pedido ya está cerrado"
  4. UPDATE orders SET status='CANCELADO', cancelled_at=now(), cancel_reason=$2
  5. COMMIT (la tx es corta — solo SELECT FOR UPDATE + UPDATE)
  6. emit OrderCancelled
  7. return { ok: true }
```

### useOrderHistory (B9-B)

```
URL: /orders/history?cursor=<base64-{created_at,id}>
useInfiniteQuery({
  queryKey: ['orders', 'history', customerId],
  queryFn: ({ pageParam }) => ordersRepo.findByCustomer(customerId, { cursor: pageParam, limit: 20 }),
  getNextPageParam: lastPage => lastPage.nextCursor,
  initialPageParam: null,
})
```

Repo `findByCustomer` (ya existe en `orders.supabase.ts` o se extiende):
```sql
SELECT id, public_id, status, total_cents, created_at, store_id
FROM orders
WHERE customer_id = auth.uid()
  AND ($cursor IS NULL OR (created_at, id) < ($cursor.createdAt, $cursor.id))
ORDER BY created_at DESC, id DESC
LIMIT 21  -- pedimos N+1 para saber si hay next page
```

Skill rule `data-pagination`. Índice compuesto `(customer_id, created_at DESC, id DESC)` debe existir (verificar B1.3 — si no existe, agregarlo en la migración).

### Push opt-in (B9-C)

Componente `PushOptInToggle` + hook `usePushSubscribe`:

```
1. Render inicial: leer Notification.permission
   - 'granted' + subscription existente → toggle ON
   - 'granted' + sin subscription → toggle OFF (re-subscribe disponible)
   - 'default' / 'denied' → toggle OFF
   - undefined (SSR / no soporte) → toggle hidden
2. Click toggle ON:
   a. await Notification.requestPermission()
   b. if not granted → toast "permiso denegado"
   c. const swReg = await navigator.serviceWorker.ready
   d. const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY  -- env var, ya existe en B8.1
      })
   e. await PushService.subscribeUser({ endpoint, keys })  -- POST /api/push/subscribe (B8.1)
   f. invalidate query ['push', 'subscription', userId]
3. Click toggle OFF:
   a. await sub.unsubscribe()
   b. await PushService.unsubscribeUser({ endpoint })
```

### updateProfile (B9-C)

Server Action en `features/profile/actions.ts`:

```
Cliente UI: ProfilePage con DisplayNameField + AvatarUpload
  ↓ Si avatar cambió: AvatarUpload primero llama StorageService.upload
  ↓
useUpdateProfileMutation
  ↓
updateProfile({ displayName?, avatarUrl? })
  1. Auth: const userId = auth.uid()
  2. UPDATE users SET
       display_name = COALESCE($1, display_name),
       avatar_url = COALESCE($2, avatar_url)
     WHERE id = $userId
     RETURNING display_name, avatar_url
  3. invalidate query ['user', userId]
```

`AvatarUpload` interno:
```
1. file = <input type=file accept="image/*">
2. validar size < 5MB, formato jpeg/png/webp
3. await StorageService.upload({ bucket: 'avatars', path: `${userId}/${uuid()}.webp`, file })
4. return public URL
5. setAvatarUrl(url) en form state
```

## Error handling

Mapeo deterministic de errores → mensaje usuario en español (i18n via `next-intl`):

| Origen | HTTP | Mensaje UI (es) | Logueado server-side |
|---|---|---|---|
| Zod parse fail | 400 | "datos inválidos: \<campo\>" | sí, con campo + valor |
| RLS deny | 403 | "no autorizado" | sí, con userId + recurso |
| State machine reject | 409 | "no podés \<accion\> en este estado" | sí, con orderId + transition |
| FK / unique violation | 500 | "error inesperado, reintentá" | sí, full error |
| Network / timeout | client | "sin conexión, reintentá" | client-side toast |
| Push permission denied | client | "permiso denegado por el navegador" | no |
| Avatar > 5MB | client | "la imagen es muy grande (máx 5MB)" | no |

Logger: structured (B12-A) con campos `{ actor, action, orderId?, latencyMs, errorCode? }`.

## Testing strategy (TDD-first, write-tests-first)

Por cada pieza, ciclo estricto: **RED (test escrito, falla por no impl) → GREEN (impl mínima) → REFACTOR → cobertura ≥80%**.

### Bloques TDD y casos críticos

**1. submitOrder Server Action — integration vs Supabase local**

| Caso | Comportamiento esperado |
|---|---|
| happy path: customer auth + 3 items válidos | INSERT 1 order + 3 order_items, status `ENVIADO`, snapshot price coincide |
| customer no autenticado | 401, no INSERT |
| product eliminado entre cart-add y submit | reject "producto no disponible", rollback |
| store inactiva (`status='inactive'`) | reject "tienda no disponible" |
| input items vacío | Zod 400 |
| atomicidad: simulate fail después de orders insert | rollback completo, no order_items huérfanos (test con tx fault injection) |
| batch insert vs N+1 inserts | verificar 1 sola statement (count via pg_stat_statements en test) |
| pricing snapshot | order_items.price_cents_snapshot === products.price_cents al momento de submit, NO al precio del cart |

**2. cancelOrder Server Action — integration**

| Caso | Comportamiento esperado |
|---|---|
| happy `ENVIADO` → `CANCELADO` | UPDATE row, cancelled_at set, cancel_reason persisted |
| happy `RECIBIDO` → `CANCELADO` | igual |
| `ACEPTADO` → reject | 409, status no cambia |
| `EN_CAMINO` → reject | 409 |
| `FINALIZADO` (terminal) → reject | 409 "ya está cerrado" |
| Otro customer intenta cancelar | RLS deny → 404 |
| Order no existe | 404 |

**3. useOrderHistory hook — integration con seed**

- Seed de 50 orders del mismo customer, varias fechas.
- Page 1: 20 orders, ordenados DESC.
- Page 2: 20 orders siguientes, sin gaps ni duplicados (cursor stable).
- Page 3: 10 orders + `nextCursor === null`.
- Caso edge: 0 orders → page vacía + `nextCursor === null`.
- Cross-customer: cliente B no ve orders del cliente A (RLS).

**4. usePushSubscribe — unit + integration**

- Unit: mock de `Notification` API y `navigator.serviceWorker.ready`. Verificar branches (granted/denied/no-soporte).
- Integration: con permission granted simulado → POST a `/api/push/subscribe` real → row en `push_subscriptions` (verifica B8.1 wiring).
- Unsubscribe path.

**5. updateProfile Server Action — integration**

- Happy: cambio display_name → row updateado, avatar_url intacto.
- Happy: cambio avatar_url → row updateado, display_name intacto.
- Cambio ambos.
- Customer A intenta updatear a customer B → RLS deny.
- display_name vacío string → reject (Zod min(1)).

**6. E2E happy path (Playwright, 1 test)**

Flow completo:
1. Cliente loguea (auth real).
2. Va al mapa, abre tienda.
3. Agrega 1 producto al cart.
4. Submitea pedido.
5. Es redirigido a `/orders/{publicId}`.
6. Ve estado `ENVIADO`.
7. Click cancel.
8. Ve estado `CANCELADO`.
9. Va a history.
10. Pedido aparece en lista con estado `CANCELADO`.

### Cobertura objetivo

- **Mínimo 80% statements + branches** (CLAUDE.md §6 + global testing.md).
- Cada `.ts` con lógica → `.test.ts` adyacente.
- Tests integration corren contra Supabase local levantado por el worktree.

## Observability

- Logger structured (B12-A) en cada Server Action con `{ actor, action, orderId?, latencyMs, errorCode? }`.
- Sentry breadcrumbs (B12.4) capturan errores no manejados.
- Métricas opcionales (post-MVP): `orders_submitted_total`, `orders_cancelled_total`, `push_subscribed_total`.

## Plan de ejecución (orden estricto de bloques)

| # | Bloque | TDD | Output |
|---|---|---|---|
| 0 | `/b-start B9-B` (worktree + claim) | — | Worktree activo, INDEX.md actualizado |
| 1 | Verificar schema users + bucket avatars; migración si falta | sí (pgTAP) | 0 o 1 migración aplicada local |
| 2 | **B9-B.1 submitOrder** (action + schemas + swap useSendOrderMutation) | RED→GREEN | Server Action verde, mutation swappeada |
| 3 | **B9-B.2 cancelOrder** (action + swap useCancelOrderMutation) | RED→GREEN | idem |
| 4 | **B9-B.3 OrderTracking container swap** (probable swap-only de container) | tests existentes | UI consume hooks reales |
| 5 | **B9-B.4 useOrderHistory** (hook + container `OrderHistoryScreen`) | RED→GREEN | History paginada |
| 6 | **B9-B.5 cleanup**: borrar `orders.mock.ts` (con grep previo a admin/store) | typecheck + lint | 0 imports rotos |
| 7 | **B9-C.1 usePushSubscribe + PushOptInToggle** | RED→GREEN | Push opt-in funcional |
| 8 | **B9-C.2 updateProfile + DisplayNameField + AvatarUpload** | RED→GREEN | Edición perfil funcional |
| 9 | **B9-C.3 ProfilePage container final** | tests existentes | UI completa |
| 10 | E2E happy path Playwright (escribir test → ejecutar contra app local) | escribir test → correr → debug si rojo | E2E verde |
| 11 | Code review 2-pass (memoria `feedback_code_review_verification`) | — | 0 CRITICAL + 0 HIGH confirmados |
| 12 | `/b-finish` B9-B | — | INDEX.md B9-B cerrado, commit final |
| 13 | Claim B9-C en el mismo worktree (commit `chore(epic-backend): claim B9-C`) | — | INDEX.md B9-C en in-progress |
| 14 | `/b-finish` B9-C | — | epic fase B9 cerrada (3/3) |

> **Nota sobre bloque 13:** se claimea B9-C en el mismo worktree porque el usuario decidió un único worktree para ambas tareas. Si en el cierre de B9-B el protocolo o un hook nos obliga a abrir un worktree nuevo, lo consultamos antes — no se asume.

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Schema users sin `display_name`/`avatar_url` | media | bajo | Detectado en bloque 1, migración mínima |
| `orders.mock.ts` aún importado en admin/store features | media | medio | Grep previo. Si está usado → defer borrado a B10/B11 (no es blocker de B9-B) |
| Budget de líneas excede 2500 | medio | alto | Monitorear por commit. Si en bloque 4 ya pasamos 2000 nuevas → splittear (B9-B2 separa tracking+history a otra rama) |
| `/b-start` claimea sólo 1 tarea | alto | bajo | Claim B9-B primero. Cierre con `/b-finish`. Después claim B9-C (mismo worktree o nuevo según protocolo). |
| RLS policy de `push_subscriptions` requiere `auth.uid()` directo (anti-patrón) | baja | medio | Si el lint SQL de B2.5 lo flagea → usar `(select auth.uid())`. Verificar policy existente. |
| Realtime ya integrado pero apunta a mock | baja | bajo | Verificar antes de bloque 4. Si está bien (B6.3 está done) → swap solo container |

## Out of scope (defer)

- Idioma / i18n preferences — producto solo en español por ahora.
- Notif prefs en DB (granular order-updates / store-arrival / marketing) — siguen en localStorage. Migrar a DB cuando el backend tenga channel filtering.
- Avatar editing UI avanzado (crop, rotate) — solo upload + preview básico.
- Re-orden / clone-order desde history — no está en task.

## Referencias

- [`docs/PRD.md`](../../PRD.md) §7 (invariantes de dominio)
- [`docs/epic-backend/INDEX.md`](../../epic-backend/INDEX.md)
- [`docs/epic-backend/convenciones.md`](../../epic-backend/convenciones.md)
- [`docs/epic-backend/portabilidad.md`](../../epic-backend/portabilidad.md)
- [`docs/workflows/backend-task-protocol.md`](../../workflows/backend-task-protocol.md)
- Skill rules: `lock-short-transactions`, `data-batch-inserts`, `data-pagination`
