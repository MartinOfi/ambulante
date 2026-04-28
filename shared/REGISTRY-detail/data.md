# REGISTRY-detail — Data

> Contiene: query keys, hooks de datos, services, repositories y offline queue.

---

## §2b — Query layer

### `shared/query/keys.ts` — queryKeys

Registro centralizado de query key factories. Organizado por dominio con jerarquía para invalidación parcial.

```ts
queryKeys.stores.all()
queryKeys.stores.nearby(coords, radiusMeters)
queryKeys.stores.byId(id)
queryKeys.stores.profile(storeId)
queryKeys.stores.byOwner(userId)     // store-dashboard: resolve store from logged-in owner
queryKeys.orders.all()
queryKeys.orders.byUser(userId)
queryKeys.orders.byStore(storeId)
queryKeys.orders.byStorePrefix()  // prefix key — para invalidar todos los byStore en onSettled
queryKeys.orders.byId(id)
queryKeys.orders.byStore(storeId)    // store-side: fetch incoming orders
queryKeys.products.all()
queryKeys.products.byStore(storeId)
queryKeys.catalog.byStore(storeId)
queryKeys.catalog.byId(id)
queryKeys.reports.all()
queryKeys.reports.byStatus(status: ReportStatus)
queryKeys.users.all()
queryKeys.users.byId(id)
```

**Nota:** `products.*` = catálogo read-only (client-facing). `catalog.*` = catálogo CRUD (store owner). Mutaciones de catálogo solo invalidan `catalog.*`. `reports.*` = cola de moderación de contenido admin (F14.3). `users.*` = gestión de usuarios (admin-only, F14.5).

### `shared/query/parseResponse.ts` — parseResponse + ParseError

- **API:** `parseResponse(schema, promise, options?)` → `Promise<z.infer<TSchema>>`
  - Ejecuta `schema.safeParse()` sobre el resultado de la promesa antes de entrar al cache de React Query.
  - Si la validación falla, lanza `ParseError` con el `ZodError` como `cause` y loguea el error con contexto.
  - Errores de red (upstream) se re-lanzan sin envoltura.
  - `options.onError?` — inyección de dependencia para el logger (útil en tests).
- **Tipos exportados:** `ParseError` (clase), `ParseResponseOptions` (interfaz)
- **Uso canónico:**
  ```ts
  const store = await parseResponse(storeSchema, storesService.findById(id));
  ```

### `shared/query/offline-queue.ts` — offlineQueue

Cola de mutations pendientes para operaciones offline. Persiste en IndexedDB. Valida con Zod antes de guardar. Limpia la cola atómicamente en `dequeueAll`. `registerBackgroundSync` registra Background Sync API degradando silenciosamente en iOS Safari.

- **API:**
  - `enqueueItem({ type, payload }): Promise<string>` — encola un pedido, retorna el id generado
  - `dequeueAll(): Promise<readonly OfflineQueueItem[]>` — lee y limpia la cola; items malformados se omiten con log
  - `registerBackgroundSync(): Promise<void>` — registra tag `ambulante-sync-orders` (no-op si API no disponible)
- **Schemas exportados:** `sendOrderPayloadSchema`, `offlineQueueItemSchema`
- **Tipos exportados:** `SendOrderPayload`, `OfflineQueueItem`, `CreateQueueItemInput`
- **Constantes:** ver `shared/constants/background-sync.ts`
- **Tests:** `shared/query/offline-queue.test.ts` (10 casos, usa `fake-indexeddb`)

### `shared/query/useRealtimeInvalidation.ts`

- **API:** `useRealtimeInvalidation({ channel: string, queryKey: readonly unknown[] }): void`
- **Descripción:** Hook bridge que conecta `realtimeService.subscribe` con `queryClient.invalidateQueries`. Se suscribe en mount, invalida `queryKey` en cada mensaje, desuscribe en unmount. Usa `useRef` para capturar queryKey sin re-disparar el efecto en cada render.
- **Nota:** solo re-subscribe cuando cambia `channel`. `queryKey` se actualiza via ref — no es dependencia del efecto.

---

## §3 — Hooks de datos

### `useSession` — `shared/hooks/useSession.ts`
- **API:** `useSession(service?): SessionState & { signIn, signUp, signOut }`
- **Descripción:** Obtiene la sesión al montar, suscribe a cambios de auth via `onAuthStateChange`, expone `signIn`/`signUp`/`signOut`. Acepta una instancia de `AuthService` (default: singleton `authService`) para facilitar tests.
- **Estados discriminados:** `loading | authenticated | unauthenticated | error`
- **Tipo:** `SessionState` — cuando `status === "authenticated"` expone `session: Session`.

### `useGeolocation` — `shared/hooks/useGeolocation.ts`
- **API:** `useGeolocation(): GeoState & { request: () => void }`
- **Descripción:** Trackea posición del usuario de forma continua via `watchPosition`; actualiza coords en tiempo real mientras el usuario se mueve. Filtra lecturas con `accuracy > MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR`. Limpieza en unmount via `clearWatch`. `request()` reinicia el watch (útil para recenter o retry tras error). (PRD §7.5)
- **Estados discriminados:** `idle | loading | granted | denied | error`

### `useRealtimeStatus` — `shared/hooks/useRealtimeStatus.ts`
- **API:** `useRealtimeStatus(service?: RealtimeService): RealtimeStatus`
- **Descripción:** Retorna el estado de conexión del realtime service y se actualiza en tiempo real via `onStatusChange`. Acepta `service` opcional para tests. Doble lectura de `status()` — evita race condition entre render y subscripción.
- **Valores:** `"online" | "connecting" | "offline"`

### Hooks feature-local — orders

| Nombre | Ruta | Descripción |
|---|---|---|
| `useOrderQuery` | `features/orders/hooks/useOrderQuery.ts` | `useOrderQuery(orderId: string)` — fetches single order, retorna `Order \| null`. Key: `queryKeys.orders.byId(orderId)` |
| `useAcceptOrderMutation` | `features/orders/hooks/useAcceptOrderMutation.ts` | Tienda acepta pedido; optimistic update: snapshot + write `ACEPTADO`; rollback en `onError`; invalida `orders.byId` + `orders.all` en `onSettled` |
| `useSendOrderMutation` | `features/orders/hooks/useSendOrderMutation.ts` | `mutate({ storeId, items, notes? })` — crea pedido en `ENVIADO`; snapshot inmutable de productos (PRD §7.4); invalida `orders.all()` |

### Hooks feature-local — map

| Nombre | Ruta | Descripción |
|---|---|---|
| `useStoresNearbyQuery` | `features/map/hooks/useStoresNearbyQuery.ts` | `useStoresNearbyQuery({ coords: Coordinates \| null, radius: RadiusValue })` — disabled si `coords === null`; key: `queryKeys.stores.nearby(coords, radius)` |
| `useStoreByIdQuery` | `features/map/hooks/useStoreByIdQuery.ts` | `useStoreByIdQuery(storeId: string \| null)` — disabled cuando `storeId` es null |
| `useStoreProductsQuery` | `features/map/hooks/useStoreProductsQuery.ts` | `useStoreProductsQuery(storeId: string \| null)` — key: `queryKeys.products.byStore(storeId)` |

### Hooks feature-local — store-dashboard

| Nombre | Ruta | Descripción |
|---|---|---|
| `useCurrentStoreQuery` | `features/store-dashboard/hooks/useCurrentStoreQuery.ts` | Resuelve la tienda del usuario autenticado via `useSession` → `storesService.findByOwnerId`. Key: `queryKeys.stores.byOwner(userId)`. Disabled cuando `userId === null`. |
| `useStoreOrdersQuery` | `features/orders/hooks/useStoreOrdersQuery.ts` | `useStoreOrdersQuery({ storeId, status? })` — fetches orders for a store. Key: `queryKeys.orders.byStore(storeId)`. Disabled cuando `storeId === null`. |

### Hooks feature-local — store-profile

| Nombre | Ruta | Descripción |
|---|---|---|
| `useStoreProfileQuery` | `features/store-profile/hooks/useStoreProfileQuery.ts` | `useStoreProfileQuery(storeId: string \| null)` — disabled si storeId vacío; key: `queryKeys.stores.profile(storeId)` |
| `useUpdateStoreProfileMutation` | `features/store-profile/hooks/useUpdateStoreProfileMutation.ts` | `useUpdateStoreProfileMutation(storeId: string)` — optimistic update pattern; `mutate(input: UpdateStoreProfileInput)` |

### Hooks feature-local — user-management

| Nombre | Ruta | Descripción |
|---|---|---|
| `useUsersQuery` | `features/user-management/hooks/useUsersQuery.ts` | `useUsersQuery({ service, role? })` — lista todos los usuarios; key: `queryKeys.users.all()` |
| `useSuspendUserMutation` | `features/user-management/hooks/useSuspendUserMutation.ts` | `mutate(userId: string)` — suspende usuario y cancela pedidos activos; invalida `users.all()` |
| `useReinstateUserMutation` | `features/user-management/hooks/useReinstateUserMutation.ts` | `mutate(userId: string)` — reactiva usuario suspendido; invalida `users.all()` |

---

## §4 — Services

> Clientes de datos. Hoy devuelven mocks; mañana apuntarán a la API real. **No importar mocks directamente en componentes; siempre consumir vía los hooks de §3.**

### `auditLogService` — `shared/services/audit-log.ts` / `shared/services/audit-log.mock.ts`

- **Descripción:** Servicio append-only de auditoría de transiciones de pedidos (PRD §6.2). Semántica de solo-inserción — no hay métodos de update ni delete. En producción apuntará a la tabla `order_audit_log` (Supabase, migración `docs/migrations/001_audit_log.sql`); hoy implementado como mock en memoria.
- **Interface:** `AuditLogService` — `append(entry: NewAuditLogEntry): Promise<void>`, `findByOrderId(orderId: string): Promise<readonly AuditLogEntry[]>`
- **Factory exportada:** `createMockAuditLogService()` — instancia aislada con seed de 4 pedidos demo (happy path, rechazado, expirado, cancelado)
- **Singleton:** `auditLogService` — exportado desde `audit-log.mock.ts` para uso en runtime
- **Tipos clave:** `AuditLogEntry`, `NewAuditLogEntry` (en `shared/domain/audit-log.ts`)
- **Tests:** `shared/services/audit-log.mock.test.ts` (7 casos), `shared/domain/audit-log.test.ts` (schemas)

### `analyticsService` — `shared/services/analytics.ts`
- **Constants/schemas:** `shared/constants/analytics-events.ts`
- **Descripción:** Servicio de analytics con transporte swapeable (Vercel Analytics en prod, logger en dev). Valida props con Zod antes de enviar — lanza `ZodError` si el payload es inválido.
- **Interface:** `AnalyticsService` — `track<E>(event: E, props: AnalyticsEventMap[E]): void`
- **Factory exportada:** `createAnalyticsService(transport: AnalyticsTransport)` — recibe transporte para tests aislados.
- **Singleton:** `analyticsService` — usa `vercelTransport` en producción, `devTransport` (logger) en desarrollo.
- **Tipos clave:** `AnalyticsTransport`, `AnalyticsPropertyValue`, `AnalyticsService`
- **Constantes:** `ANALYTICS_EVENT` as const — eventos tipados; `analyticsEventSchemas` — schemas Zod por evento; `AnalyticsEventMap` — tipo de props por evento.
- **Eventos registrados:** `ORDER_SENT`, `ORDER_ACCEPTED` (`waitMs`), `ORDER_REJECTED` (`reason?`), `ORDER_ON_THE_WAY`, `ORDER_FINISHED` (`totalMs`), `ORDER_CANCELLED`, `ORDER_EXPIRED`, `STORE_VIEWED`, `STORE_AVAILABILITY_CHANGED` (`available: boolean`), `MAP_OPENED`.
- **Tests:** `shared/services/analytics.test.ts` (7 casos)
- **Integración:** `<Analytics />` de `@vercel/analytics/next` inyectado en `app/layout.tsx`.

### `kpiService` — `shared/services/kpi.ts`
- **Descripción:** KPI instrumentation service. Wrapper sobre `analyticsService` con funciones tipadas por KPI (PRD §8). Calcula automáticamente `waitMs` y `totalMs` desde fechas de transición.
- **Interface:** `KpiService` — `trackOrderSent`, `trackOrderAccepted`, `trackOrderRejected`, `trackOrderExpired`, `trackOrderFinalized`, `trackStoreAvailabilityChanged`
- **Factory exportada:** `createKpiService(analytics: AnalyticsService)` — para tests aislados.
- **Singleton:** `kpiService`
- **Helper puro:** `computeDeltaMs(from: Date, to: Date): number`
- **Input interfaces:** `TrackOrderSentInput`, `TrackOrderAcceptedInput`, `TrackOrderRejectedInput`, `TrackOrderExpiredInput`, `TrackOrderFinalizedInput`, `TrackStoreAvailabilityChangedInput`
- **Tests:** `shared/services/kpi.test.ts` (12 casos)
- **Dashboard docs:** `docs/kpi-dashboard.md`

### `authService` — `shared/services/auth.ts`
- **Tipos:** `shared/services/auth.types.ts`
- **Descripción:** Implementación mock de `AuthService`. Gestiona sesión en memoria, pre-seed 3 usuarios (`client/store/admin @test.com`, password `"password"`).
- **Interface:** `AuthService` — `signIn(input)`, `signUp(input)`, `signInWithMagicLink(input)`, `signInWithGoogle(input?)`, `signOut()`, `getSession()`, `getUser()`, `onAuthStateChange(cb)`
- **Tipos clave:** `SignInInput`, `SignUpInput`, `AuthResult<T>`, `AuthStateChangeCallback`

### `realtimeService` — `shared/services/realtime.ts`
- **Tipos:** `shared/services/realtime.types.ts`
- **Descripción:** Abstracción de transporte realtime swapeable (mock in-memory → Supabase Realtime). Se integra con el `eventBus` via `registerSerializationHook`. Arranca en estado `"online"`.
- **Interface:** `RealtimeService` — `subscribe(channel, handler)` → `() => void`, `unsubscribe(channel)`, `broadcast(channel, event, payload)`, `status()` → `RealtimeStatus`, `onStatusChange(handler)` → `() => void`, `reconnect()`, `destroy()`
- **Reconnect:** exponential backoff — `RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR^attempt`, capped at `RECONNECT_MAX_DELAY_MS`, stops after `RECONNECT_MAX_ATTEMPTS`.
- **Test escape hatches:** `_testSetStatus(status)` — fuerza el estado; `_testSimulateDisconnect()` — emite `"offline"` y arranca el loop.
- **Factory exportada:** `createMockRealtimeService(options?)` — recibe `eventBus` y `broadcastChannel?: BroadcastChannel | null`. Tests pasan `null` (default) para aislamiento; el singleton pasa `new BroadcastChannel("ambulante-realtime-mock")` para propagación cross-tab.
- **Cross-tab bridge (F5.5):** el singleton crea un `BroadcastChannel`; cada evento serializado se rebroadcastea con `tabId` para evitar self-echo. Tabs receptoras llaman `deliverToChannel` localmente.
- **Canales:** `REALTIME_CHANNELS` as const — `{ orders: "orders", stores: "stores" }`
- **Tipos clave:** `RealtimeStatus`, `RealtimeMessage<T>`, `RealtimeHandler<T>`, `RealtimeStatusHandler`, `RealtimeChannel`

### `storesService` — `shared/services/stores.ts`
- **Descripción:** Cliente de tiendas detrás de `StoresService`. Delega a `storeRepository` (F3.4).
- **API:** `findNearby({ coords, radiusMeters })`, `findById(id)`, `findByOwnerId(ownerId)`, `updateLocation(storeId, coords)`
- **Tipos:** `StoresService`, `FindNearbyInput` re-exportados desde `shared/repositories/store`

### `productsService` — `shared/services/products.ts`
- **Tipos:** `shared/services/products.types.ts`
- **Descripción:** Cliente de productos detrás de `ProductsService`. Delega a `productRepository`.
- **API:** `findByStore(storeId: string): Promise<readonly Product[]>`
- **Tipo:** `ProductsService`

### `storageService` — `shared/services/storage.ts`
- **Tipos:** `shared/services/storage.types.ts`
- **Descripción:** Abstracción de almacenamiento de archivos swapeable (mock → Supabase Storage). Retorna resultados con discriminant `success` para manejo de errores uniforme.
- **Interface:** `StorageService` — `upload(params)` → `Promise<StorageResult<UploadResult>>`, `remove(params)` → `Promise<StorageResult<void>>`, `getPublicUrl(params)` → `string`
- **Tipos clave:** `UploadParams` (`bucket`, `path`, `file: Blob | File`), `RemoveParams` (`bucket`, `paths: string[]`), `GetPublicUrlParams` (`bucket`, `path`), `StorageResult<T>`, `UploadResult` (`path`, `url`)
- **Constantes:** `STORAGE_BUCKETS` (`STORE_IMAGES`, `PRODUCT_IMAGES`), `MOCK_STORAGE_BASE_URL` — en `shared/constants/storage.ts`
- **Singleton:** `storageService`

### `pushService` — `shared/services/push.ts`
- **Tipos:** `shared/services/push.types.ts`
- **Descripción:** Abstracción de notificaciones push swapeable (mock → Web Push API real + VAPID). SSR-safe: todas las rutas verifican `typeof window / typeof Notification`.
- **Interface:** `PushService` — `requestPermission()`, `subscribe()` → `PushSubscriptionData | null`, `unsubscribe()` → `boolean`, `sendTestNotification(title, body)`, `getPermissionStatus()` → `PushPermissionStatus`
- **Factory exportada:** `createMockPushService()` — instancia aislada por test
- **Singleton:** `pushService` — usado en runtime
- **Tipos clave:** `PushPermissionStatus` (`"default" | "granted" | "denied" | "unavailable"`), `PushSubscriptionData` (endpoint + keys p256dh/auth)

---

## §5 — Supabase facades (stubs B3.2) + factory

> **Portabilidad (CLAUDE.md §10.3):** `@supabase/*` solo se importa en estos archivos. Features y componentes **nunca** importan el SDK directo — consumen los facades via `shared/services/index.ts`.

### Factory — `shared/services/index.ts`

Lee `process.env.NEXT_PUBLIC_SUPABASE_URL` al momento de la evaluación del módulo:
- **Sin URL** (`""` / `undefined`) → exporta los singletons mock (los mismos de §4).
- **Con URL** → exporta los stubs Supabase de abajo.

```ts
import { authService, realtimeService, pushService, storageService } from "@/shared/services";
```

### `supabaseAuthService` — `shared/services/auth.supabase.ts`
- Implementa `AuthService` con llamadas reales a Supabase (B4.3).
- Importa `createBrowserClient` de `@supabase/ssr`; instancia el cliente con env vars dentro de cada método (lazy, no module-level).
- **Interface completa:** `signIn`, `signUp`, `signInWithMagicLink` (OTP), `signInWithGoogle` (OAuth — `skipBrowserRedirect: true`, devuelve `{ url }`), `signOut`, `getSession`, `getUser`, `onAuthStateChange`.
- **Mapeo de roles:** `user_metadata.role` → fallback `app_metadata.role` → default `"client"`. Solo acepta `"store"` y `"admin"` como valores explícitos.

### `supabaseRealtimeService` — `shared/services/realtime.supabase.ts` ✅ B6.2
- Implementa `RealtimeService` (misma interface que `realtime.ts`) usando Supabase Realtime broadcast.
- Importa `createBrowserClient` de `@supabase/ssr` con inicialización lazy (primer uso) para seguridad en SSR y tests.
- **DI seam:** `SupabaseRealtimeClient` — interfaz mínima (`channel`, `removeChannel`) para testabilidad sin env vars.
- **Factory:** `createSupabaseRealtimeService(client?: SupabaseRealtimeClient)` — acepta cliente inyectado; crea `createBrowserClient` on demand si no se provee.
- **Channels:** Supabase broadcast mode. `buildChannel` se suscribe a `{ event: "*" }` y despacha a handlers por `channelName`.
- **Reconnect:** exponential backoff idéntico al mock. `reconnect()` fuerza restart inmediato aunque ya haya un loop en progreso (semántica: "intentar ahora, resetear backoff").
- **Singleton:** `supabaseRealtimeService` exportado desde el módulo.
- **Tests:** `shared/services/realtime.supabase.test.ts` — 32 casos con `MockChannel`/`MockClient` inyectados.

### `supabasePushService` / `createServerPushSender` / `getServerPushSender` — `shared/services/push.supabase.ts`
- `supabasePushService` — implementa `PushService` (misma interface que `push.ts`). Todos los métodos lanzan `Error("TODO — implementar en B6")`.
- **`createServerPushSender({ pushRepo }): ServerPushSender`** — factory server-side (B8.2). Inicializa VAPID con `VAPID_SUBJECT / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY`. `sendToUser(userId, payload)` consulta `pushRepo.findAll({ userId })`, envía vía `webpush.sendNotification` usando `Promise.allSettled` (resiliencia — un 410 no bloquea los demás), loguea fallos individuales.
- **`getServerPushSender(): ServerPushSender`** — singleton lazy (`??=`). La inicialización diferida evita que la validación de URL de Supabase falle al importar en entornos de test.
- **Interface `ServerPushSender`:** `sendToUser(userId: string, payload: PushNotificationPayload): Promise<void>` — en `shared/services/push.types.ts`.
- **Interface `PushNotificationPayload`:** `{ title: string; body: string; icon?: string }` — en `shared/services/push.types.ts`.
- **Helper:** `createPushClient()` — disponible para B6.
- **Tests:** `shared/services/push.supabase.test.ts` (7 casos — envío múltiple, shape correcto, JSON serializado, sin subscripciones, userId correcto, resiliencia a rechazo parcial).

### `supabaseStorageService` — `shared/services/storage.supabase.ts`
- Implementa `StorageService` (misma interface que `storage.ts`).
- Importa `createClient` de `@supabase/supabase-js`.
- **Helper:** `createStorageClient()` — disponible para B8.
- Todos los métodos lanzan `Error("TODO — implementar en B8")`.

---

## §6 — Clientes Supabase (`shared/repositories/supabase/client.ts`)

> **Portabilidad (CLAUDE.md §10.3):** estos son los únicos archivos autorizados a importar `@supabase/ssr`. Features, hooks y componentes **nunca** instancian el cliente directo — usan los facades de §5 o los repositories de §11.

Cuatro factories que wrappean `@supabase/ssr` con la configuración de cookies correcta para cada contexto de Next.js App Router:

| Factory | Contexto | Descripción |
|---|---|---|
| `createBrowserClient()` | Client Component | Singleton por pestaña. Lee `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `createServerClient()` | Server Component / Server Action | Async — awaita `cookies()` del paquete `next/headers`. Lee y escribe cookies de sesión en el contexto del request. |
| `createRouteHandlerClient()` | Route Handler | Igual que `createServerClient` — separado para claridad semántica (Route Handlers no son Server Components). |
| `createMiddlewareClient(request, response)` | `middleware.ts` | Síncrono — recibe `NextRequest` + `NextResponse`. Lee cookies del request y escribe las refrescadas en el response. **Crear el response ANTES de llamar a `getUser()`** para que Supabase pueda escribir las cookies refrescadas. |

**Nota crítica sobre `middleware.ts`:** usar siempre `supabase.auth.getUser()` (valida el JWT server-side), **nunca** `getSession()` (lee de cookie, puede ser forjada).

---

## §11 — Repositories

> Capa de acceso a datos detrás de interfaces genéricas. Hoy: mocks en memoria. Mañana: Supabase. **Nunca importar los mocks directamente — usar el singleton exportado desde `shared/repositories/index.ts`.**

### `Repository<Entity, CreateInput, UpdateInput, Filters>` (base interface)
- **Ruta:** `shared/repositories/base.ts`
- **API:** `findAll(filters?)`, `findById(id)`, `create(input)`, `update(id, input)`, `delete(id)`

### StoreRepository / storeRepository
- **Ruta interface:** `shared/repositories/store.ts` → `StoreRepository`, `StoreFilters`, `FindNearbyInput`, `CreateStoreInput`, `UpdateStoreInput`
- **Ruta mock:** `shared/repositories/mock/store.mock.ts`
- **Descripción:** Extiende `Repository<Store,...>` con `findNearby({ coords, radiusMeters })`. La implementación mock filtra por distancia haversiana y ordena por cercanía.
- **Singleton:** `import { storeRepository } from '@/shared/repositories'`

### OrderRepository / orderRepository
- **Ruta interface:** `shared/repositories/order.ts` → `OrderRepository`, `OrderFilters`, `CreateOrderInput`, `UpdateOrderInput`
- **Ruta mock:** `shared/repositories/mock/order.mock.ts`
- **Descripción:** Filtros: `storeId`, `clientId`, `status`. `create` genera `id`, `createdAt`, `updatedAt`. `update` actualiza `updatedAt`.
- **Singleton:** `import { orderRepository } from '@/shared/repositories'`

### UserRepository / userRepository
- **Ruta interface:** `shared/repositories/user.ts` → `UserRepository`, `UserFilters`, `CreateUserInput`, `UpdateUserInput`
- **Ruta mock:** `shared/repositories/mock/user.mock.ts`
- **Descripción:** Extiende `Repository<User,...>` con `findByEmail(email)`. Filtros: `role`.
- **Singleton:** `import { userRepository } from '@/shared/repositories'`

### ProductRepository / productRepository
- **Ruta interface:** `shared/repositories/product.ts` → `ProductRepository`, `ProductFilters`, `CreateProductInput`, `UpdateProductInput`
- **Ruta mock:** `shared/repositories/mock/product.mock.ts`
- **Descripción:** Filtros: `storeId`, `isAvailable`.
- **Singleton:** `import { productRepository } from '@/shared/repositories'`

### PushSubscriptionRepository / pushSubscriptionRepository
- **Ruta interface:** `shared/repositories/push-subscriptions.ts` → `PushSubscriptionRepository`, `PushSubscription`, `PushSubscriptionFilters`, `CreatePushSubscriptionInput`, `UpdatePushSubscriptionInput`
- **Descripción:** CRUD de suscripciones Web Push. Extiende `Repository<PushSubscription,...>` con `findByEndpoint(endpoint)` y `upsertByEndpoint(input)`.
- **Singleton:** `import { pushSubscriptionRepository } from '@/shared/repositories'`

---

## §11b — Supabase implementations (B3.1)

> Implementaciones reales de las interfaces de §11. Constructor-injected `SupabaseClient` — funciona con browser client (anon+RLS), service-role, o mock de tests. **Importar vía `shared/repositories/index.ts`**, no directamente.

### `createSupabaseBrowserClient` / `SupabaseClient` — `shared/repositories/supabase/client.ts`
- Factory que envuelve `createBrowserClient` de `@supabase/ssr`.
- `SupabaseClient` es el tipo alias usado como parámetro de constructor en todos los repos.

### Mappers — `shared/repositories/supabase/mappers.ts`
Funciones puras de conversión DB ↔ dominio:
- `dbRoleToDomain` / `domainRoleToDb` — `"cliente" ↔ "client"`, `"tienda" ↔ "store"`
- `dbStatusToDomain` / `domainStatusToDb` — `"aceptado" ↔ "ACEPTADO"` (uppercase en dominio)
- `dbCategoryToKind` — category string → `StoreKind` (fallback `"food-truck"`)
- `dbAvailableToStatus` — `boolean → "open" | "closed"`
- `mapUserRow`, `mapStoreRow`, `mapProductRow`, `mapOrderItemRow`, `mapOrderRow`, `mapPushSubscriptionRow`
- `mapOrderItemRow` soporta tanto nombres domain (`productId/productName/productPriceArs`) como legacy (`id/name/price`)

### `SupabaseUserRepository` — `shared/repositories/supabase/users.supabase.ts`
- Implementa `UserRepository`. Filtra por `role` y `suspended`.
- Métodos: `findAll(filters?)`, `findById`, `findByEmail`, `create`, `update`, `delete` (todos por `public_id`).

### `SupabaseStoreRepository` — `shared/repositories/supabase/stores.supabase.ts`
- Implementa `StoreRepository`. Lee desde `stores_view` (tiene `lat`/`lng` via ST_Y/ST_X).
- `findNearby` llama RPC `find_stores_nearby(p_lat, p_lng, p_radius_meters)`.
- `create` resuelve `ownerId` UUID → bigint antes de insertar. Re-fetches from view post-insert/update.
- Nota: el estado `stale` no es filtrable server-side (sin timestamp de ubicación en la view).

### `SupabaseProductRepository` — `shared/repositories/supabase/products.supabase.ts`
- Implementa `ProductRepository`. SELECT incluye `store:stores!store_id(public_id)` para UUID del store en una sola query.
- `findAll({ storeId })` resuelve UUID → bigint via `resolveStoreInternalId` antes de filtrar.
- `create` resuelve store UUID → bigint antes de insertar.

### `SupabaseOrderRepository` — `shared/repositories/supabase/orders.supabase.ts`
- Implementa `OrderRepository`. SELECT anidado: `customer:users!customer_id(public_id)` + `store:stores!store_id(public_id)` + `items:order_items(product_snapshot, quantity)` — una sola query.
- `create` resuelve `clientId` + `storeId` en `Promise.all`, inserta la orden, inserta `order_items` con snapshot JSONB, re-fetches via `findById`.

### `SupabaseAuditLogService` — `shared/repositories/supabase/audit-log.supabase.ts`
- Implementa `AuditLogService`. Usa la tabla genérica `audit_log` con `table_name='orders'`, `row_id=bigint`, campos domain en `new_values` JSONB.
- `append` resuelve orden UUID → bigint, inserta. `findByOrderId` filtra por `table_name + row_id`, ordena por `created_at ASC`.
- `mapAuditRow` retorna `null` si faltan campos domain en `new_values` (filas incompletas se filtran silenciosamente).

### `SupabasePushSubscriptionRepository` — `shared/repositories/supabase/push-subscriptions.supabase.ts`
- Implementa `PushSubscriptionRepository`. `findById` usa `id` numérico (PK bigint).
- `upsertByEndpoint` usa `.upsert({ onConflict: 'endpoint' })`. `create` delega a `upsertByEndpoint`.
- SELECT incluye `user:users!user_id(public_id)` para UUID del user.
