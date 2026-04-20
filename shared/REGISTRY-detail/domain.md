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

### `shared/constants/user.ts`
| Nombre | Descripción |
|---|---|
| `USER_ROLES` | `{ client: "client", store: "store", admin: "admin" }` frozen as const |

### `shared/constants/push.ts`
| Nombre | Descripción |
|---|---|
| `PUSH_NOTIFICATION_ICON` | Ruta del icono por defecto para notificaciones push |

---

## §12 — Domain logic

### State machine — `shared/domain/order-state-machine.ts`

Máquina de estados tipada del pedido (PRD §6). Discriminated union `Order` con 8 variantes.

- **API:**
  - `transition({ order, event, actor }): TransitionResult` — sin excepciones; retorna `Result<Order, TransitionError>`
  - `ORDER_ACTOR` — `{ CLIENTE, TIENDA, SISTEMA }` as const
  - `ORDER_EVENT` — 8 eventos as const (son *comandos* — distintos de `ORDER_DOMAIN_EVENT` que son *hechos*)
- **Errores posibles:** `TERMINAL_STATE` | `INVALID_TRANSITION` | `UNAUTHORIZED_ACTOR`
- **Tipos exportados:** `Order`, `OrderActor`, `OrderEvent`, `TransitionError`, `TransitionResult`, `Result<T,E>`, variantes `OrderEnviado` … `OrderExpirado`

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

### Timeout policies + scheduler — `shared/domain/timeouts.ts`

- **API:**
  - `ORDER_TIMEOUT_POLICIES` — `Partial<Record<OrderStatus, TimeoutPolicy>>` frozen: `ENVIADO`/`RECIBIDO` → 10min, `ACEPTADO` → 2h
  - `createSetTimeoutScheduler(): TimeoutScheduler` — factory mock (usa `setTimeout`; en producción → cron/Supabase)
  - `TimeoutScheduler.schedule({ orderId, status, onFire }): () => void` — devuelve cleanup
- **Tipos exportados:** `TimeoutPolicy`, `ScheduleInput`, `TimeoutScheduler`
- **Nota:** estados sin política (terminales, EN_CAMINO) devuelven no-op cleanup — el caller no necesita verificar.
