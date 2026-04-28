# REGISTRY-detail — Domain

> Contiene: tipos TypeScript, schemas Zod, state machine, domain events, timeouts y constantes.

---

## §7 — Tipos TypeScript

Viven en `shared/types/`. Son el contrato del dominio — **siempre derivar de schemas Zod (§7b)** con `z.infer<typeof schema>`, no definir a mano. Los archivos en `shared/types/` solo re-exportan desde los schemas.

| Nombre | Ruta | Descripción |
|---|---|---|
| `Coordinates` | `shared/types/coordinates.ts` | `{ lat: number; lng: number }` con validación de rangos geográficos |
| `Product` | `shared/types/product.ts` | Producto de catálogo de una tienda (`photoUrl` y `description` opcionales) |
| `Store` | `shared/types/store.ts` | Tienda ambulante con `location: Coordinates`, `status`, `kind`, `description?`, `hours?`, `ownerId` |
| `StoreKind` | `shared/types/store.ts` | Union type: `"food-truck" \| "street-cart" \| "ice-cream"` (et al.) |
| `StoreStatus` | `shared/types/store.ts` | `"open" \| "closed" \| "stale"` |
| `User` | `shared/types/user.ts` | Usuario autenticado; `displayName` opcional |
| `UserRole` | `shared/types/user.ts` | `"client" \| "store" \| "admin"` |
| `Session` | `shared/types/user.ts` | Sesión de Supabase Auth: `accessToken`, `refreshToken`, `expiresAt` (Unix timestamp positivo), `user` |

---

## §7b — Schemas Zod

Viven en `shared/schemas/`. Son la fuente de verdad de validación — **siempre usar para parsear datos externos** (API responses, inputs de usuario, params de URL).

### Schemas compartidos

| Nombre | Ruta | Descripción |
|---|---|---|
| `coordinatesSchema` | `shared/schemas/coordinates.ts` | lat (-90..90) + lng (-180..180) |
| `storeKindSchema`, `storeStatusSchema`, `storeSchema` | `shared/schemas/store.ts` | Tienda ambulante; usa `coordinatesSchema` para `location`; `description?` y `hours?` opcionales; `storeKindSchema.options` para iterar valores |
| `productSchema` | `shared/schemas/product.ts` | `productSchema.parse(raw)` → `Product`; precio en ARS, `isAvailable`, `storeId` |
| `userRoleSchema`, `userSchema`, `sessionSchema` | `shared/schemas/user.ts` | `userRoleSchema.options` para iterar roles; `sessionSchema` valida `expiresAt > 0` |
| `orderStatusSchema`, `orderItemSchema`, `orderSchema` | `shared/schemas/order.ts` | `orderStatusSchema` usa `z.nativeEnum(ORDER_STATUS)`; `orderItemSchema` captura el snapshot de producto (PRD §7.4); timestamps ISO |

**Barrel:** `import { coordinatesSchema, storeSchema, productSchema, userSchema, orderSchema } from '@/shared/schemas'`

### Schemas feature-local (documentados aquí por ser fuente de verdad de sus tipos)

#### store-profile — `features/store-profile/schemas/store-profile.schemas.ts`
- `storeProfileSchema` — valida el perfil completo con `.refine()` que garantiza `closeTime > openTime`
- `updateStoreProfileSchema` — versión `.omit({ storeId }).partial()` para edición parcial
- **Tipos exportados:** `StoreProfile`, `UpdateStoreProfileInput`, `ProfileDay`
- **Constante:** `PROFILE_DAYS` — array readonly de los 7 días en español

#### store-onboarding — `features/store-onboarding/schemas/store-onboarding.schemas.ts`
- `stepFiscalSchema` — nombre del negocio, tipo (`storeKindSchema`) y CUIT (11 dígitos)
- `stepZoneSchema` — barrio y notas opcionales
- `stepHoursSchema` — días (`STORE_ONBOARDING_DAYS`) y horarios `HH:MM`
- `storeOnboardingSchema` — fusión de los tres para el payload final
- **Tipos exportados:** `StepFiscalValues`, `StepZoneValues`, `StepHoursValues`, `StoreOnboardingData`, `OnboardingDay`
- **Constante:** `STORE_ONBOARDING_DAYS` — array readonly de los 7 días en español

#### auth — `features/auth/schemas/auth.schemas.ts`
- `loginSchema`, `registerSchema` (con `.refine()` password === confirmPassword), `forgotPasswordSchema`, `resetPasswordSchema` (incluye `token` string no vacío)
- **Tipos exportados:** `LoginValues`, `RegisterValues`, `ForgotPasswordValues`, `ResetPasswordValues`

---

## §7c — Domain objects

| Nombre | Ruta | Descripción |
|---|---|---|
| `ProductSnapshot` | `shared/domain/product-snapshot.ts` | Tipo branded `Readonly<Product>` |
| `snapshot` | `shared/domain/product-snapshot.ts` | `(product: Product) => ProductSnapshot` — retorna `Object.freeze({ ...product })`; inmutable en runtime e type system |

---

## §8 — Constantes

Viven en `shared/constants/`. **Nunca usar magic strings/numbers en el código.**

### `shared/constants/order.ts`
| Nombre | Descripción |
|---|---|
| `ORDER_STATUS` | Objeto frozen `as const` con los 8 estados: `ENVIADO`, `RECIBIDO`, `ACEPTADO`, `RECHAZADO`, `EN_CAMINO`, `FINALIZADO`, `CANCELADO`, `EXPIRADO` |
| `TERMINAL_ORDER_STATUSES` | Array readonly de los 3 estados terminales |
| `ORDER_EXPIRATION_MINUTES` | `10` — PRD §9.2 |
| `ORDER_AUTOCLOSE_HOURS` | `2` — PRD §9.2 |
| `OrderStatus` | Unión literal de todos los valores de `ORDER_STATUS` |

### `shared/constants/routes.ts`
| Nombre | Descripción |
|---|---|
| `ROUTES` | Árbol tipado de rutas por rol: `public`, `auth`, `client`, `store`, `admin` — `as const` |
| `Route` | Unión de todos los strings leaf de `ROUTES` |
| `buildHref` | `(template, params?) => string` — interpola segmentos `:param` tipados |

API: `ROUTES.auth.login`, `ROUTES.client.map`, `ROUTES.client.orders`, `ROUTES.store.dashboard`, `ROUTES.store.orders`, `ROUTES.store.catalog`, `ROUTES.store.catalogNew`, `ROUTES.store.catalogEdit`, `ROUTES.store.profile`, `buildHref(ROUTES.store.order, { orderId: "x" })`

### `shared/constants/realtime.ts`
| Nombre | Valor | Descripción |
|---|---|---|
| `RECONNECT_INITIAL_DELAY_MS` | 1000 | Delay inicial del backoff |
| `RECONNECT_MAX_DELAY_MS` | 30000 | Techo del backoff |
| `RECONNECT_MAX_ATTEMPTS` | 6 | Intentos máximos |
| `RECONNECT_BACKOFF_FACTOR` | 2 | Factor de crecimiento exponencial |

### `shared/constants/background-sync.ts`
| Nombre | Valor | Descripción |
|---|---|---|
| `SYNC_TAG` | `"ambulante-sync-orders"` | Tag para Background Sync API |
| `OFFLINE_QUEUE_DB_NAME` | `"ambulante-offline-queue"` | Nombre de la base IndexedDB |
| `OFFLINE_QUEUE_DB_VERSION` | `1` | Versión del schema IndexedDB |
| `OFFLINE_QUEUE_STORE_NAME` | `"pending-mutations"` | Object store de IndexedDB |
| `OFFLINE_QUEUE_MAX_ATTEMPTS` | `3` | Intentos máximos de reintento |

### `shared/constants/geo.ts`
| Nombre | Descripción |
|---|---|
| `MIN_ACCURACY_METERS` | Precisión mínima aceptable (descartar lecturas peores) |
| `POOR_ACCURACY_FACTOR` | Factor multiplicador para clasificar precisión pobre |
| `GEO_TIMEOUT_MS` | Timeout de `getCurrentPosition` |
| `GEO_MAX_AGE_MS` | Max age del caché de geolocalización del browser |
| `STORE_LOCATION_REFRESH_MS` | Intervalo de reporte de ubicación de tienda (30–60s) |
| `STORE_LOCATION_STALE_MS` | Tiempo sin update para marcar "ubicación desactualizada" (2min) |

### `shared/constants/ui-messages.ts`
| Nombre | Descripción |
|---|---|
| `QUERY_ERROR_MESSAGE` | Mensaje de error en español para fallos de fetch |
| `MUTATION_ERROR_MESSAGE` | Mensaje de error en español para fallos de acción |

### `shared/constants/auth.ts`
| Nombre | Descripción |
|---|---|
| `SESSION_COOKIE_NAME` | `"ambulante-session"` |
| `SESSION_COOKIE_MAX_AGE_SECONDS` | `3600` (1h) |

### `shared/constants/radius.ts`
| Nombre | Descripción |
|---|---|
| `RADIUS_OPTIONS` | Opciones del filtro de radio (1km, 2km, 5km) |
| `RadiusValue` | Type de los valores de radio permitidos |
| `DEFAULT_RADIUS` | Radio por defecto para búsqueda |

### `shared/constants/store.ts`
| Nombre | Descripción |
|---|---|
| `STORE_KIND` | `{ foodTruck: "food-truck", streetCart: ..., iceCream: ... }` frozen as const |
| `STORE_STATUS` | `{ open: "open", closed: "closed", stale: "stale" }` frozen as const |

### `shared/constants/i18n.ts`
| Nombre | Descripción |
|---|---|
| `LOCALE` | `"es" as const` — locale único del MVP (Argentina-only per DP-7) |
| `SupportedLocale` | `typeof LOCALE` — tipo literal `"es"` |

### `shared/constants/user.ts`
| Nombre | Descripción |
|---|---|
| `USER_ROLES` | `{ client: "client", store: "store", admin: "admin" }` frozen as const |

### `shared/constants/storage.ts`
| Nombre | Descripción |
|---|---|
| `STORAGE_BUCKETS` | `{ STORE_IMAGES: "store-images", PRODUCT_IMAGES: "product-images" }` frozen as const — nombres canónicos de buckets Supabase Storage |
| `StorageBucket` | Unión literal de los valores de `STORAGE_BUCKETS` — `"store-images" \| "product-images"` |
| `MOCK_STORAGE_BASE_URL` | `"https://mock-storage.ambulante.local"` — base URL del mock local para tests y dev sin Supabase |

### `shared/constants/user-management.ts`
| Nombre | Descripción |
|---|---|
| `USER_SUSPENSION_STATUS` | `{ ACTIVE: "active", SUSPENDED: "suspended" }` frozen as const |
| `UserSuspensionStatus` | TS type derivado de `USER_SUSPENSION_STATUS` |

### `shared/schemas/user-management.ts`
| Nombre | Descripción |
|---|---|
| `suspendUserSchema` | Zod schema para input de suspensión: `{ userId: string }` |
| `reinstateUserSchema` | Zod schema para input de reactivación: `{ userId: string }` |
| `SuspendUserInput` | TS type inferido de `suspendUserSchema` |
| `ReinstateUserInput` | TS type inferido de `reinstateUserSchema` |

### `shared/constants/push.ts`
| Nombre | Descripción |
|---|---|
| `PUSH_NOTIFICATION_ICON` | Ruta del icono por defecto para notificaciones push |

### `shared/constants/service-worker.ts`
| Nombre | Descripción |
|---|---|
| `SW_MESSAGE_TYPE` | `{ SKIP_WAITING: "SKIP_WAITING" }` frozen as const — tipos de mensajes postMessage al SW |
| `SwMessageType` | TS type derivado de `SW_MESSAGE_TYPE` |
| `SW_UPDATE_CHECK_INTERVAL_MS` | `3_600_000` (1h) — intervalo de polling para `registration.update()` |
| `SW_UPDATE_STATUS` | `{ IDLE, AVAILABLE, DISMISSED, APPLYING }` frozen as const — máquina de estados del update banner |
| `SwUpdateStatus` | TS type derivado de `SW_UPDATE_STATUS` |

---

## §12 — Domain logic

### State machine — `shared/domain/order-state-machine.ts`

Máquina de estados tipada del pedido (PRD §6). Discriminated union `Order` con 8 variantes.

- **API:**
  - `transition({ order, event, actor }): TransitionResult` — puro, sin excepciones; retorna `Result<Order, TransitionError>`
  - `transitionWithAudit({ order, event, actor, auditLog }): Promise<TransitionResult>` — wrapper async que llama a `transition()` y, en éxito, hace `auditLog.append()`. Si el append falla, loguea y devuelve el resultado igualmente — la auditoría nunca bloquea la transición.
  - `ORDER_ACTOR` — `{ CLIENTE, TIENDA, SISTEMA }` as const
  - `ORDER_EVENT` — 8 eventos as const (son *comandos* — distintos de `ORDER_DOMAIN_EVENT` que son *hechos*)
- **Errores posibles:** `TERMINAL_STATE` | `INVALID_TRANSITION` | `UNAUTHORIZED_ACTOR`
- **Tipos exportados:** `Order`, `OrderActor`, `OrderEvent`, `TransitionError`, `TransitionResult`, `Result<T,E>`, `TransitionWithAuditInput`, variantes `OrderEnviado` … `OrderExpirado`

### Audit log domain — `shared/domain/audit-log.ts`

Schemas Zod y tipos TS para las entradas del log de auditoría inmutable (PRD §6.2).

- **API:**
  - `auditLogEntrySchema` — schema completo con `id`; para parsear entradas leídas desde BD
  - `newAuditLogEntrySchema` — `auditLogEntrySchema.omit({ id }).strict()` — rechaza `id` en insert; para validar `NewAuditLogEntry` antes de persistir
- **Campos:** `id`, `orderId`, `actor` (enum CLIENTE/TIENDA/SISTEMA), `eventType` (8 eventos), `fromStatus`, `toStatus`, `occurredAt: Date`
- **Tipos exportados:** `AuditLogEntry`, `NewAuditLogEntry`

### Domain events + event bus

#### `shared/domain/events.ts`
- **Exports:**
  - `ORDER_DOMAIN_EVENT` — const con 8 tipos de evento (son *hechos*, distintos de `ORDER_EVENT` de la state machine que son *comandos*)
  - `serializeEvent(event): SerializedDomainEvent` — convierte `Date` → ISO string
- **Tipos exportados:** `OrderDomainEvent` (discriminated union de 8 variantes), `OrderDomainEventType`, `SerializedDomainEvent`, `EventHandler<E>`, `SerializationHook`

#### `shared/domain/event-bus.ts`
- **API:**
  - `createEventBus(): EventBus` — factory (cada test crea su instancia aislada)
  - `eventBus` — singleton para uso en runtime
  - `EventBus.publish(event)` · `EventBus.subscribe(type, handler): () => void` · `EventBus.registerSerializationHook(hook): () => void`
- **Tipo exportado:** `EventBus`

### Client location privacy — `shared/domain/client-location-access.ts`

Implementa el invariante PRD §9.4: la ubicación del cliente **nunca** se expone al actor TIENDA antes de que el pedido esté en estado `ACEPTADO`.

- **API:**
  - `getClientLocationForStore({ order, requesterRole, location }): LocationAccessResult`
    - TIENDA: retorna `ok: true` solo en `ACEPTADO`, `EN_CAMINO`, `FINALIZADO`; `{ ok: false, error: { kind: "FORBIDDEN" } }` en todos los demás estados
    - CLIENTE y SISTEMA: siempre retornan `ok: true` con las coordenadas
    - Las coordenadas retornadas son una **copia nueva** (inmutabilidad garantizada)
- **Tipos exportados:** `RequesterRole`, `LocationAccessError`, `LocationAccessResult`, `GetClientLocationInput`
- **Nota:** usa `Result<T,E>` del state machine — mismo patrón sin excepciones

### Timeout policies + scheduler — `shared/domain/timeouts.ts`

- **API:**
  - `ORDER_TIMEOUT_POLICIES` — `Partial<Record<OrderStatus, TimeoutPolicy>>` frozen: `ENVIADO`/`RECIBIDO` → 10min, `ACEPTADO` → 2h
  - `createSetTimeoutScheduler(): TimeoutScheduler` — factory mock (usa `setTimeout`; en producción → cron/Supabase)
  - `TimeoutScheduler.schedule({ orderId, status, onFire }): () => void` — devuelve cleanup
- **Tipos exportados:** `TimeoutPolicy`, `ScheduleInput`, `TimeoutScheduler`
- **Nota:** estados sin política (terminales, EN_CAMINO) devuelven no-op cleanup — el caller no necesita verificar.

---

## §13 — Tablas SQL del dominio (B1.2)

Definidas en `supabase/migrations/20260427000001_core_tables.sql`. Convenciones: `snake_case` lowercase; PKs `bigint generated always as identity`; `public_id uuid default gen_random_uuid()` en tablas expuestas al cliente; `timestamptz` para todos los timestamps.

### Enum types

| Nombre | Valores |
|---|---|
| `public.user_role` | `'cliente'`, `'tienda'`, `'admin'` |
| `public.order_status` | `'enviado'`, `'recibido'`, `'aceptado'`, `'en_camino'`, `'finalizado'`, `'rechazado'`, `'cancelado'`, `'expirado'` |

### Tablas

| Tabla | PK | Notas clave |
|---|---|---|
| `public.users` | `id bigint` | `public_id uuid`, `auth_user_id uuid` unique; sincronizada desde `auth.users` via trigger `handle_new_auth_user()` (SECURITY DEFINER) |
| `public.stores` | `id bigint` | `public_id uuid`; `current_location geometry(Point,4326)` denormalizado — actualizado por trigger `sync_store_current_location` en INSERT de `store_locations` |
| `public.products` | `id bigint` | `public_id uuid`; `price numeric(10,2)` check ≥ 0; `currency text` default `'ARS'` |
| `public.orders` | `id bigint` | `public_id uuid`; `status order_status` default `'enviado'`; `customer_location geometry(Point,4326)` — expuesta a tienda solo post-ACEPTADO (RLS B2.1) |
| `public.order_items` | `id bigint` | Append-only (sin `updated_at`); `product_id` FK nullable (ON DELETE SET NULL); `product_snapshot jsonb not null` — fuente de verdad del snapshot |
| `public.store_locations` | `id bigint` | Append-only (sin `updated_at`); `location geometry(Point,4326) not null`; INSERT actualiza `stores.current_location` via trigger |
| `public.push_subscriptions` | `id bigint` | `endpoint text` unique; `p256dh`, `auth_key`, `user_agent` text |
| `public.audit_log` | `id bigint` | Append-only (sin `updated_at`); `actor_id bigint` — soft reference (no FK, para sobrevivir DELETE de usuario) |

### Trigger functions

| Función | Tipo | Propósito |
|---|---|---|
| `public.set_updated_at()` | BEFORE UPDATE | Actualiza `updated_at = now()` en las 5 tablas mutables |
| `public.sync_store_current_location()` | AFTER INSERT on store_locations | Denormaliza `location` → `stores.current_location` |
| `public.handle_new_auth_user()` | AFTER INSERT on auth.users | Crea fila en `public.users` (SECURITY DEFINER) |

### FK cubiertos por índice (regla B1.5)

Todas las columnas FK tienen índice explícito en la misma migración: `stores(owner_id)`, `products(store_id)`, `orders(store_id)`, `orders(customer_id)`, `order_items(order_id)`, `order_items(product_id)`, `store_locations(store_id)`, `push_subscriptions(user_id)`.

---

## §14 — Scheduled jobs (B7.1)

Definidos en `supabase/migrations/20260428000000_schedule_crons.sql`. Usan `pg_cron` + `pg_net`. Los Route Handlers que ejecutan la lógica viven en `app/api/cron/` (B7.2, B7.3).

### Helper PL/pgSQL

| Función | Schema | Descripción |
|---|---|---|
| `internal.call_cron_endpoint(path text)` | `internal` | Lanza HTTP POST autenticado a `${app.settings.site_url}${path}` con header `Authorization: Bearer <cron_secret>`. SECURITY DEFINER. Fire-and-forget via `net.http_post()`. |

**Inyección de settings:**
- `app.settings.cron_secret` — mínimo 16 chars. Local: `ALTER DATABASE postgres SET ...` en `supabase/seed.sql`. Prod: Supabase secrets dashboard (B14).
- `app.settings.site_url` — URL base del Next.js server. Local: `http://127.0.0.1:3000`. Prod: URL de producción.

### Cron schedules

| Nombre | Expresión | Ruta | PRD ref |
|---|---|---|---|
| `expire-orders` | `* * * * *` (cada 1 min) | `/api/cron/expire-orders` | §7.6: EXPIRADO tras 10min sin respuesta |
| `auto-close-orders` | `*/10 * * * *` (cada 10 min) | `/api/cron/auto-close-orders` | §7.6: auto-cierre ACEPTADO tras 2h |

**Tests:** `supabase/tests/b7_1_schedule_crons.sql` (pgTAP — verifica schema, función, privilegios y schedules).

---

## §15 — RLS policies (B2.1)

Definidas en `supabase/migrations/20260428000000_rls_policies.sql`. Todas las tablas tienen `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`. Patrón de rendimiento: `(select auth.uid())` evaluado una vez por query, no por fila.

### Helper functions (SECURITY DEFINER, search_path = '')

| Función | Retorno | Descripción |
|---|---|---|
| `public.current_user_id()` | `bigint` | `id` del usuario autenticado en `public.users` vía `auth_user_id`. Retorna NULL si el usuario no tiene fila en public.users. |
| `public.current_store_id()` | `bigint` | `id` de la tienda cuyo `owner_id` coincide con el usuario autenticado. Retorna NULL si el caller no es dueño de ninguna tienda. |
| `public.is_admin()` | `boolean` | `true` si el usuario autenticado tiene `role = 'admin'` en `public.users`. |

### Resumen de policies por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE | Notas |
|---|---|---|---|---|---|
| `users` | propio o admin | — (server) | propio | — (server) | INSERT via auth trigger (service role) |
| `stores` | disponibles, propio o admin | — (server) | dueño | — (server) | |
| `products` | disponibles, propios o admin | dueño | dueño | dueño | Owners ven también los no-disponibles |
| `orders` | cliente propio, tienda propia o admin | cliente | — (server) | — | Transiciones solo via server actions |
| `order_items` | órdenes del cliente, tienda o admin | cliente | — | — | Append-only |
| `store_locations` | todos (autenticados) | dueño | — | — | Append-only |
| `push_subscriptions` | propio | propio | propio | propio | |
| `audit_log` | admin | — (service) | — | — | Solo service role escribe |

**PRD §7.2 (privacidad customer_location):** la visibilidad de fila es concedida por RLS; la privacidad de la columna `customer_location` para el rol tienda se implementa en B2.2 via security-barrier view `orders_for_tienda`.
