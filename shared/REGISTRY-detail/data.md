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
queryKeys.orders.all()
queryKeys.orders.byUser(userId)
queryKeys.orders.byId(id)
queryKeys.products.all()
queryKeys.products.byStore(storeId)
queryKeys.catalog.byStore(storeId)
queryKeys.catalog.byId(id)
queryKeys.users.all()
queryKeys.users.byId(id)
```

**Nota:** `products.*` = catálogo read-only (client-facing). `catalog.*` = catálogo CRUD (store owner). `users.*` = gestión de usuarios (admin-only).

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
- **Descripción:** Obtiene posición del navegador con filtrado de precisión (PRD §7.1).
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

### `analyticsService` — `shared/services/analytics.ts`
- **Constants/schemas:** `shared/constants/analytics-events.ts`
- **Descripción:** Servicio de analytics con transporte swapeable (Vercel Analytics en prod, logger en dev). Valida props con Zod antes de enviar — lanza `ZodError` si el payload es inválido.
- **Interface:** `AnalyticsService` — `track<E>(event: E, props: AnalyticsEventMap[E]): void`
- **Factory exportada:** `createAnalyticsService(transport: AnalyticsTransport)` — recibe transporte para tests aislados.
- **Singleton:** `analyticsService` — usa `vercelTransport` en producción, `devTransport` (logger) en desarrollo.
- **Tipos clave:** `AnalyticsTransport`, `AnalyticsPropertyValue`, `AnalyticsService`
- **Constantes:** `ANALYTICS_EVENT` as const — eventos tipados; `analyticsEventSchemas` — schemas Zod por evento; `AnalyticsEventMap` — tipo de props por evento.
- **Tests:** `shared/services/analytics.test.ts` (7 casos)
- **Integración:** `<Analytics />` de `@vercel/analytics/next` inyectado en `app/layout.tsx`.

### `authService` — `shared/services/auth.ts`
- **Tipos:** `shared/services/auth.types.ts`
- **Descripción:** Implementación mock de `AuthService`. Gestiona sesión en memoria, pre-seed 3 usuarios (`client/store/admin @test.com`, password `"password"`).
- **Interface:** `AuthService` — `signIn(input)`, `signUp(input)`, `signOut()`, `getSession()`, `onAuthStateChange(cb)`
- **Tipos clave:** `SignInInput`, `SignUpInput`, `AuthResult<T>`, `AuthStateChangeCallback`

### `realtimeService` — `shared/services/realtime.ts`
- **Tipos:** `shared/services/realtime.types.ts`
- **Descripción:** Abstracción de transporte realtime swapeable (mock in-memory → Supabase Realtime). Se integra con el `eventBus` via `registerSerializationHook`. Arranca en estado `"online"`.
- **Interface:** `RealtimeService` — `subscribe(channel, handler)` → `() => void`, `unsubscribe(channel)`, `status()` → `RealtimeStatus`, `onStatusChange(handler)` → `() => void`, `reconnect()`, `destroy()`
- **Reconnect:** exponential backoff — `RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR^attempt`, capped at `RECONNECT_MAX_DELAY_MS`, stops after `RECONNECT_MAX_ATTEMPTS`.
- **Test escape hatches:** `_testSetStatus(status)` — fuerza el estado; `_testSimulateDisconnect()` — emite `"offline"` y arranca el loop.
- **Factory exportada:** `createMockRealtimeService(options?)` — recibe `eventBus` opcional para tests aislados.
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

### `pushService` — `shared/services/push.ts`
- **Tipos:** `shared/services/push.types.ts`
- **Descripción:** Abstracción de notificaciones push swapeable (mock → Web Push API real + VAPID). SSR-safe: todas las rutas verifican `typeof window / typeof Notification`.
- **Interface:** `PushService` — `requestPermission()`, `subscribe()` → `PushSubscriptionData | null`, `unsubscribe()` → `boolean`, `sendTestNotification(title, body)`, `getPermissionStatus()` → `PushPermissionStatus`
- **Factory exportada:** `createMockPushService()` — instancia aislada por test
- **Singleton:** `pushService` — usado en runtime
- **Tipos clave:** `PushPermissionStatus` (`"default" | "granted" | "denied" | "unavailable"`), `PushSubscriptionData` (endpoint + keys p256dh/auth)

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
