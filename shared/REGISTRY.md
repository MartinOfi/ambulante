# Shared Registry

> **Índice vivo de todo lo reutilizable.** Antes de crear cualquier componente, hook, util, service, constante o tipo nuevo, **leé este archivo primero**. Si ya existe algo que sirve, reutilizalo o extendelo — nunca dupliques.
>
> **Regla de oro:** al agregar, modificar o eliminar algo en `shared/`, actualizar este archivo **en el mismo commit**.

---

## Cómo usar este archivo

1. **Antes de crear algo:** buscá acá (Ctrl+F) por nombre, propósito o categoría.
2. **Si existe y te sirve:** importalo con alias (`@/shared/...`).
3. **Si existe pero no encaja perfecto:** extendelo o generalizalo — no crees una versión paralela.
4. **Si no existe:** creálo, y agregá la entrada correspondiente acá.
5. **Si algo queda sin uso:** eliminarlo del código y del registry.

---

## 1. Componentes UI (`shared/components/ui/`)

> Primitivas de shadcn/ui. Se añaden con `pnpm dlx shadcn@latest add <component>`.

### Button

- **Ruta:** `shared/components/ui/button.tsx`
- **Descripción:** Botón shadcn con variantes (default, destructive, outline, secondary, ghost, link) y tamaños.
- **API:** `<Button variant size asChild />`
- **Usado en:** `features/landing/*`, cualquier CTA.

### Card

- **Ruta:** `shared/components/ui/card.tsx`
- **Descripción:** Contenedor shadcn con `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Usado en:** `radial-orbital-timeline`.

### Badge

- **Ruta:** `shared/components/ui/badge.tsx`
- **Descripción:** Pastilla pequeña con variantes (default, secondary, destructive, outline).
- **Usado en:** `radial-orbital-timeline`.

### Popover

- **Ruta:** `shared/components/ui/popover.tsx`
- **Descripción:** Popover radix-ui. Exporta `Popover`, `PopoverTrigger`, `PopoverContent`.
- **Usado en:** `features/landing/components/LandingNav/MobileNav`.

### NavigationMenu

- **Ruta:** `shared/components/ui/navigation-menu.tsx`
- **Descripción:** Menú de navegación radix-ui con sublistas y viewport.
- **Usado en:** `features/landing/components/LandingNav/*`.

### RadialOrbitalTimeline

- **Ruta:** `shared/components/ui/radial-orbital-timeline.tsx`
- **Descripción:** Timeline radial animado (shadcn/magicui) para mostrar pasos con conexiones orbitales.
- **API:** `<RadialOrbitalTimeline timelineData={TimelineItem[]} />`
- **Usado en:** `features/landing/components/HowItWorks`.
- **⚠️ Excepción §6.5:** 323 líneas — supera el límite de 300. Es una primitiva externa de shadcn/magicui; tocar su estructura interna rompe el contrato del componente. Tratar como dependencia de terceros.

---

## 2. Componentes compuestos (`shared/components/`)

### ThemeProvider

- **Ruta:** `shared/components/theme/ThemeProvider.tsx`
- **Descripción:** Provider de `next-themes` que envuelve la app para soportar dark/light mode.
- **Usado en:** `app/layout.tsx`.

### ThemeToggle

- **Ruta:** `shared/components/theme/ThemeToggle.tsx`
- **Descripción:** Botón que alterna entre light/dark.
- **Usado en:** `features/landing/components/LandingNav/LandingNav`.

### Layout primitives (Stack, Row, Container, Screen, Spacer, Divider)

- **Ruta barrel:** `shared/components/layout/index.ts`
- **Rutas individuales:** `shared/components/layout/{Stack,Row,Container,Screen,Spacer,Divider}/`
- **Descripción:** Primitivas de layout flexbox + contenedor. Todas polimórficas vía prop `as`.
  - `Stack` — flex-col, props: `gap`, `align`, `justify`, `as`
  - `Row` — flex-row, props: `gap`, `align`, `justify`, `wrap`, `as`
  - `Container` — max-width centrado, props: `size` (sm/md/lg/xl/full), `padded`, `as`
  - `Screen` — wrapper full-viewport `min-h-screen overflow-y-auto`, props: `className`
  - `Spacer` — `aria-hidden` spacer, props: `size` (1–16), `axis` (vertical/horizontal)
  - `Divider` — `<hr>` con `border-border`, props: `orientation` (horizontal/vertical)
- **Tipo polimórfico compartido:** `shared/components/layout/polymorphic.types.ts` → `PolymorphicProps<T, Extra>`
- **API:** `import { Stack, Row, Container, Screen, Spacer, Divider } from '@/shared/components/layout'`

---

## 2b. Query (`shared/query/`)

### queryKeys

- **Ruta:** `shared/query/keys.ts`
- **Descripción:** Registro centralizado de query key factories para React Query v5. Organizado por dominio con jerarquía para invalidación parcial.
- **API:** `queryKeys.stores.all()`, `queryKeys.stores.nearby(coords, radiusMeters)`, `queryKeys.stores.byId(id)`, `queryKeys.orders.all()`, `queryKeys.orders.byUser(userId)`, `queryKeys.orders.byId(id)`
- **Usado en:** hooks de data en `features/*/hooks/`.

### parseResponse + ParseError

- **Ruta:** `shared/query/parseResponse.ts`
- **Descripción:** Helper de boundary que ejecuta `schema.safeParse()` sobre el resultado de una promesa antes de que los datos entren al cache de React Query. Si la validación falla, lanza `ParseError` con el `ZodError` como `cause` y loguea el error con contexto. Errores de red (upstream) se re-lanzan sin envoltura.
- **API:** `parseResponse(schema, promise, options?)` → `Promise<z.infer<TSchema>>`
  - `options.onError?` — inyección de dependencia para el logger (útil en tests)
- **Tipos exportados:** `ParseError` (clase), `ParseResponseOptions` (interfaz)
- **Uso canónico:**
  ```ts
  const store = await parseResponse(storeSchema, storesService.findById(id));
  ```
- **Usado en:** cualquier `queryFn` que consuma datos externos (features/*/hooks/).

---

## 2c. Providers (`shared/providers/`)

### QueryProvider

- **Ruta:** `shared/providers/QueryProvider.tsx`
- **Descripción:** Envuelve la app con `QueryClientProvider` de React Query v5. Crea un `QueryClient` estable por instancia con defaults de staleTime (30s), gcTime (5min), retry (1) y `refetchOnWindowFocus: false`. Monta `ReactQueryDevtools` solo en `NODE_ENV === "development"`.
- **API:** `<QueryProvider>{children}</QueryProvider>`
- **Usado en:** `app/layout.tsx`.

### NuqsProvider

- **Ruta:** `shared/providers/NuqsProvider.tsx`
- **Descripción:** Adaptador de `nuqs` para Next.js App Router. Necesario para que cualquier hook `useQueryState` / `useQueryStates` funcione. Envuelve toda la app en `app/layout.tsx`.
- **API:** `<NuqsProvider>{children}</NuqsProvider>`
- **Usado en:** `app/layout.tsx`, `features/map/hooks/useRadiusParam`.

---

## 3. Hooks (`shared/hooks/`)

### useGeolocation

- **Ruta:** `shared/hooks/useGeolocation.ts`
- **Descripción:** Obtiene la posición actual del navegador con filtrado de precisión (PRD §7.1). Retorna un discriminated union `GeoState`.
- **API:** `useGeolocation(): GeoState & { request: () => void }`
- **Estados:** `idle | loading | granted | denied | error`
- **Usado en:** `features/map/components/MapScreen.container`.

---

## 4. Services (`shared/services/`)

> Clientes de datos. Hoy devuelven mocks; mañana apuntarán a la API real. Los componentes consumen services, nunca mocks directos.

### storesService

- **Ruta:** `shared/services/stores.ts`
- **Descripción:** Cliente de tiendas detrás de una interfaz `StoresService`. Delega a `storeRepository` (F3.4). Swap a Supabase → solo cambiar el repository, sin tocar consumers.
- **API:** `findNearby({ coords, radiusMeters })`, `findById(id)`
- **Tipos:** `StoresService`, `FindNearbyInput` re-exportados desde `shared/repositories/store`
- **Usado en:** `features/map/hooks/useNearbyStores`.

---

## 5. Utils (`shared/utils/`)

> Funciones puras genéricas. Sin efectos secundarios.

### cn

- **Ruta:** `shared/utils/cn.ts`
- **Descripción:** Combina clases de Tailwind con `clsx` + `tailwind-merge`.
- **API:** `cn(...inputs: ClassValue[]): string`
- **Usado en:** prácticamente todos los componentes con Tailwind.

### formatDistance

- **Ruta:** `shared/utils/format.ts`
- **Descripción:** Formatea metros a "320 m" o "1.2 km".
- **API:** `formatDistance(meters: number): string`
- **Usado en:** `features/map/components/StoreCard`.

### formatPrice

- **Ruta:** `shared/utils/format.ts`
- **Descripción:** Formatea a moneda `es-AR` (default ARS).
- **API:** `formatPrice(amount: number, currency?: string): string`
- **Usado en:** `features/map/components/StoreCard`.

### logger

- **Ruta:** `shared/utils/logger.ts`
- **Descripción:** Abstracción de logging con niveles `debug | info | warn | error`. Dev: imprime a consola. Prod: silencioso salvo `error`, que llama al hook registrado (stub noop hasta F8.1 que conecta Sentry).
- **API:** `logger.debug(msg, ctx?)` · `logger.info(msg, ctx?)` · `logger.warn(msg, ctx?)` · `logger.error(msg, ctx?)` · `logger.registerErrorHook(hook)`
- **API alternativa:** `createLogger(env)` — factory para tests que necesitan instancia fresca.
- **Tipos exportados:** `Logger`, `LogContext`, `ErrorHook`
- **Usado en:** todos los `catch` blocks del proyecto. Reemplaza `console.*` prohibidos.

---

## 6. Styles (`shared/styles/`)

### tokens

- **Ruta:** `shared/styles/tokens.ts`
- **Descripción:** Single source of truth de design tokens tipados. Exporta `COLORS` (raw HSL values por modo + CSS var refs para Tailwind), `RADIUS`, `SHADOWS`, `MOTION` (keyframes, durations, easings, animations), `TYPOGRAPHY`.
- **API:** `import { COLORS, RADIUS, SHADOWS, MOTION, TYPOGRAPHY } from '@/shared/styles/tokens'`
- **Usado en:** `tailwind.config.ts` (via import relativo — los path aliases no aplican en ese contexto Node.js)
- **Nota:** `COLORS.raw.light` / `COLORS.raw.dark` son los valores crudos HSL para uso runtime. `COLORS.cssVarRefs` contiene las references `hsl(var(--token))` para el config de Tailwind.

---

## 7. Types (`shared/types/`)

> Tipos compartidos del dominio. **Los tipos son inferidos de los schemas Zod en `shared/schemas/`.** Los archivos en `shared/types/` solo re-exportan. Los tipos específicos de una feature van en su carpeta, no acá.

### Store, StoreKind, StoreStatus

- **Ruta:** `shared/types/store.ts` (re-export de `@/shared/schemas/store`)
- **Descripción:** Modelo de tienda ambulante y tipos asociados.
- **Usado en:** `features/map/*`, `shared/services/stores`.

### Coordinates

- **Ruta:** `shared/types/coordinates.ts` (re-export de `@/shared/schemas/coordinates`)
- **Descripción:** Par lat/lng con validación de rangos geográficos válidos.
- **Usado en:** `shared/hooks/useGeolocation`, `shared/query/keys`, `features/map/*`.

### Product

- **Ruta:** `shared/types/product.ts` (re-export de `@/shared/schemas/product`)
- **Descripción:** Producto del catálogo de una tienda.
- **Usado en:** futuras features de pedido y catálogo.

### User, UserRole

- **Ruta:** `shared/types/user.ts` (re-export de `@/shared/schemas/user`)
- **Descripción:** Usuario autenticado con rol (`client` | `store` | `admin`).
- **Usado en:** features de auth, F2.x, dashboard.

---

## 7b. Schemas Zod (`shared/schemas/`)

> Single source of truth de validación runtime + tipos. Los tipos de `shared/types/` se infieren de estos schemas.

### coordinatesSchema, Coordinates

- **Ruta:** `shared/schemas/coordinates.ts`
- **Descripción:** Coordenadas geográficas con validación de rangos (lat -90..90, lng -180..180).
- **API:** `coordinatesSchema.parse(raw)` → `Coordinates`

### storeKindSchema, storeStatusSchema, storeSchema

- **Ruta:** `shared/schemas/store.ts`
- **Descripción:** Schemas de tienda ambulante; usa `coordinatesSchema` para el campo `location`.
- **API:** `storeSchema.parse(raw)` → `Store`; `storeKindSchema.options` para iterar valores.

### productSchema, Product

- **Ruta:** `shared/schemas/product.ts`
- **Descripción:** Producto del catálogo (precio, disponibilidad, storeId). `photoUrl` y `description` opcionales.
- **API:** `productSchema.parse(raw)` → `Product`

### userRoleSchema, userSchema

- **Ruta:** `shared/schemas/user.ts`
- **Descripción:** Usuario con roles `client | store | admin`. `displayName` opcional.
- **API:** `userSchema.parse(raw)` → `User`; `userRoleSchema.options` para iterar roles.

### orderStatusSchema, orderItemSchema, orderSchema, OrderItem, Order

- **Ruta:** `shared/schemas/order.ts`
- **Descripción:** Schemas de pedido. `orderStatusSchema` usa `z.nativeEnum(ORDER_STATUS)` para preservar tipos literales. `orderItemSchema` captura el snapshot de producto al momento del pedido (invariante §7.4 del PRD). `orderSchema` une ambos con timestamps ISO.
- **API:** `orderSchema.parse(raw)` → `Order`; tipos exportados: `OrderItem`, `Order`
- **Nota:** el snapshot de producto (productId, productName, productPriceArs) en `orderItemSchema` es inmutable después de creado.

### Barrel `shared/schemas/index.ts`

- Exporta todos los schemas: `import { coordinatesSchema, storeSchema, productSchema, userSchema, orderSchema } from '@/shared/schemas'`

---

## 7c. Domain (`shared/domain/`)

> Invariantes y lógica de dominio pura. Sin efectos secundarios, sin dependencias de UI.

### ProductSnapshot, snapshot

- **Ruta:** `shared/domain/product-snapshot.ts`
- **Descripción:** Tipo `ProductSnapshot` (branded `Readonly<Product>`) e helper `snapshot(product)` que crea una copia congelada del producto al momento de crear un pedido (PRD §7.4 / CLAUDE §7.4).
- **API:** `snapshot(product: Product): ProductSnapshot` — retorna `Object.freeze({ ...product })` con brand type.
- **Garantías:** el objeto retornado es inmutable en runtime (`Object.isFrozen === true`) y en el type system (no assignable a `Product` mutable).
- **Usado en:** futura feature `order-flow` al crear pedidos.

---

## 8. Constants (`shared/constants/`)

> Reemplazan magic strings / numbers. Todo lo de dominio con significado semántico.

### RADIUS_OPTIONS, RadiusValue, DEFAULT_RADIUS

- **Ruta:** `shared/constants/radius.ts`
- **Descripción:** Opciones del filtro de radio (1km, 2km, 5km) y default.
- **Usado en:** `features/map/*`.

### MIN_ACCURACY_METERS, POOR_ACCURACY_FACTOR, GEO_TIMEOUT_MS, GEO_MAX_AGE_MS, STORE_LOCATION_REFRESH_MS, STORE_LOCATION_STALE_MS

- **Ruta:** `shared/constants/geo.ts`
- **Descripción:** Timings y tolerancias de geolocalización definidos en PRD §7.1.
- **Usado en:** `shared/hooks/useGeolocation`.

### ROUTES, Route, buildHref

- **Ruta:** `shared/constants/routes.ts`
- **Descripción:** Árbol tipado de todas las rutas de la app por rol (`public`, `client`, `store`, `admin`). `ROUTES` es `as const` — el compilador detecta typos en rutas. `buildHref(template, params?)` interpola segmentos `:param` tipados.
- **API:** `ROUTES.client.map`, `ROUTES.store.dashboard`, `buildHref(ROUTES.store.order, { orderId: "x" })`
- **Tipo:** `Route` = unión de todos los strings leaf de `ROUTES`.
- **Usado en:** `features/landing/*` (migrables), cualquier `<Link>` o `router.push`.

### ORDER_STATUS, OrderStatus, TERMINAL_ORDER_STATUSES, ORDER_EXPIRATION_MINUTES, ORDER_AUTOCLOSE_HOURS

- **Ruta:** `shared/constants/order.ts`
- **Descripción:** Constantes del dominio de pedidos. `ORDER_STATUS` es un objeto frozen `as const` con los 8 estados de la máquina de estados (PRD §6.1). `TERMINAL_ORDER_STATUSES` es un array readonly de los 3 estados terminales. Los timeouts siguen §9.2 del PRD.
- **API:** `ORDER_STATUS.ACEPTADO`, `TERMINAL_ORDER_STATUSES`, `ORDER_EXPIRATION_MINUTES` (10), `ORDER_AUTOCLOSE_HOURS` (2)
- **Tipo exportado:** `OrderStatus` = unión literal de todos los valores de `ORDER_STATUS`.
- **Usado en:** máquina de estados (F3.2), transiciones de pedido, guards de inmutabilidad en estados terminales.

### USER_ROLES, UserRole

- **Ruta:** `shared/constants/user.ts`
- **Descripción:** Roles de usuario del sistema (PRD §4). Objeto frozen `as const` con los 3 roles.
- **API:** `USER_ROLES.CLIENTE`, `USER_ROLES.TIENDA`, `USER_ROLES.ADMIN`
- **Tipo exportado:** `UserRole` = `"CLIENTE" | "TIENDA" | "ADMIN"`.
- **Usado en:** guards de autorización, lógica de transición de estados (§7.3 aislamiento de roles).

---

## 9. Config (`shared/config/`)

> Configuración validada al arranque. Fail-fast si el ambiente es inválido.

### env, parseEnv, Env

- **Ruta:** `shared/config/env.ts` (re-export TS) + `shared/config/env.mjs` (schema puro) + `shared/config/env.runtime.mjs` (side-effect de validación al boot).
- **Descripción:** Variables de entorno tipadas con Zod. `parseEnv(raw)` valida un objeto arbitrario; `env` es el resultado congelado de parsear `process.env` al import.
- **Schema actual:** `NODE_ENV` (enum dev/test/prod, default dev) + `NEXT_PUBLIC_APP_URL` (url).
- **Usado en:** `next.config.mjs` (import side-effect para validar al build). Consumers TS deben importar `env` desde `@/shared/config/env`.
- **⚠️ Por qué dos archivos `.mjs`:** Next 14 no puede importar `.ts` desde `next.config.mjs`. El schema vive en ESM puro para ser consumible por ambos mundos. Con Next 15 (F0.8 ✅) existe la opción de unificar en `.ts` vía `next.config.ts`; refactor queda como tarea futura, no bloqueante.

---

## 10. Stores (`shared/stores/`)

> Estado global del cliente con Zustand. Usar **solo** cuando React state local no alcance (CLAUDE.md §2 Stack).
>
> **Convención de slices:** separar `State` (readonly) de `Actions` en interfaces distintas. Exportar el hook completo como `use<Name>Store`.
> **Persistencia:** usar `persist` middleware con `partialize` para serializar solo el state, no las acciones.
> **Selección granular:** `const value = useXStore((s) => s.field)` — nunca desestructurar el store entero para evitar re-renders innecesarios.

### useUIStore

- **Ruta:** `shared/stores/ui.ts`
- **Descripción:** Preferencias de UI persistidas en localStorage. Incluye `theme` (light/dark/system) y `isSidebarOpen`.
- **API:**
  - Estado: `theme: Theme`, `isSidebarOpen: boolean`
  - Acciones: `setTheme(theme)`, `toggleSidebar()`, `setSidebarOpen(isOpen)`
- **Persistencia:** `ambulante-ui-preferences` en localStorage (solo state, sin acciones).
- **Tipo re-exportado:** `Theme = "light" | "dark" | "system"`
- **Usado en:** ThemeProvider, layouts con sidebar.

---

## 11. Repositories (`shared/repositories/`)

> Capa de acceso a datos detrás de interfaces genéricas. Hoy: mocks en memoria. Mañana: Supabase. Nunca importar los mocks directamente — usar el singleton exportado desde `shared/repositories/index.ts`.

### Repository\<Entity, CreateInput, UpdateInput, Filters\> (base interface)

- **Ruta:** `shared/repositories/base.ts`
- **Descripción:** Interface genérica con `findAll(filters?)`, `findById(id)`, `create(input)`, `update(id, input)`, `delete(id)`.
- **API:** Extender para crear interfaces de dominio específicas.

### StoreRepository / storeRepository

- **Ruta interface:** `shared/repositories/store.ts` → `StoreRepository`, `StoreFilters`, `FindNearbyInput`, `CreateStoreInput`, `UpdateStoreInput`
- **Ruta mock:** `shared/repositories/mock/store.mock.ts`
- **Descripción:** Extiende `Repository<Store,...>` con `findNearby({ coords, radiusMeters })`. La implementación mock filtra por distancia haversiana y ordena por cercanía.
- **Singleton:** `import { storeRepository } from '@/shared/repositories'`
- **Usado en:** `shared/services/stores.ts`

### OrderRepository / orderRepository

- **Ruta interface:** `shared/repositories/order.ts` → `OrderRepository`, `OrderFilters`, `CreateOrderInput`, `UpdateOrderInput`
- **Ruta mock:** `shared/repositories/mock/order.mock.ts`
- **Descripción:** Acceso a pedidos. Filtros: `storeId`, `clientId`, `status`. `create` genera `id`, `createdAt`, `updatedAt` automáticamente. `update` actualiza `updatedAt`.
- **Singleton:** `import { orderRepository } from '@/shared/repositories'`

### UserRepository / userRepository

- **Ruta interface:** `shared/repositories/user.ts` → `UserRepository`, `UserFilters`, `CreateUserInput`, `UpdateUserInput`
- **Ruta mock:** `shared/repositories/mock/user.mock.ts`
- **Descripción:** Extiende `Repository<User,...>` con `findByEmail(email)`. Filtros: `role`.
- **Singleton:** `import { userRepository } from '@/shared/repositories'`

### ProductRepository / productRepository

- **Ruta interface:** `shared/repositories/product.ts` → `ProductRepository`, `ProductFilters`, `CreateProductInput`, `UpdateProductInput`
- **Ruta mock:** `shared/repositories/mock/product.mock.ts`
- **Descripción:** Acceso a productos del catálogo. Filtros: `storeId`, `isAvailable`.
- **Singleton:** `import { productRepository } from '@/shared/repositories'`

---

## 12. Domain (`shared/domain/`)

> Lógica de dominio pura — sin dependencias de framework. Funciones puras, tipos discriminados, invariantes de negocio.

### order-state-machine

- **Ruta:** `shared/domain/order-state-machine.ts`
- **Descripción:** Máquina de estados tipada del pedido (PRD §6). Discriminated union `Order` con 8 variantes (`OrderEnviado` … `OrderFinalizado`). Función `transition({ order, event, actor })` retorna `Result<Order, TransitionError>` — sin excepciones. Estados terminales son inmutables. Toda transición registra timestamp.
- **API:**
  - `transition({ order, event, actor }): TransitionResult`
  - `ORDER_ACTOR` — `{ CLIENTE, TIENDA, SISTEMA }` as const
  - `ORDER_EVENT` — 8 eventos as const
  - Tipos: `Order`, `OrderActor`, `OrderEvent`, `TransitionError`, `TransitionResult`, `Result<T,E>`
  - Variantes: `OrderEnviado`, `OrderRecibido`, `OrderAceptado`, `OrderRechazado`, `OrderEnCamino`, `OrderFinalizado`, `OrderCancelado`, `OrderExpirado`
- **Errores posibles:** `TERMINAL_STATE` | `INVALID_TRANSITION` | `UNAUTHORIZED_ACTOR`
- **Usado en:** F3.5 (domain events), F3.6 (timeouts), F4.2 (mutation pattern), F12+ (features de pedido).

### domain events + event bus

- **Ruta eventos:** `shared/domain/events.ts`
- **Ruta bus:** `shared/domain/event-bus.ts`
- **Descripción:** Capa de domain events del pedido. `events.ts` define 8 tipos discriminados (`OrderSentDomainEvent` … `OrderExpiredDomainEvent`) + union `OrderDomainEvent` + `SerializedDomainEvent` (JSON-safe). `event-bus.ts` implementa pub/sub en memoria con aislamiento de errores por handler y hook de serialización para F5 realtime.
- **API:**
  - `ORDER_DOMAIN_EVENT` — const con 8 tipos de evento
  - `serializeEvent(event): SerializedDomainEvent` — convierte `Date` → ISO string
  - `createEventBus(): EventBus` — factory testeable (cada test crea su instancia aislada)
  - `eventBus` — singleton exportado para uso en runtime
  - `EventBus.publish(event)` · `EventBus.subscribe(type, handler): () => void` · `EventBus.registerSerializationHook(hook): () => void`
- **Tipos exportados:** `OrderDomainEvent`, `OrderDomainEventType`, `SerializedDomainEvent`, `EventHandler<E>`, `SerializationHook`, `EventBus`
- **Nota:** Los `ORDER_DOMAIN_EVENT` son *hechos* (algo ocurrió), distintos de `ORDER_EVENT` de `order-state-machine` que son *comandos* (algo se pide).
- **Usado en:** F4.2 (mutations disparan eventos), F5 (realtime registra serialization hook), F12+ (features de pedido).

### Timeout policies + scheduler (`shared/domain/timeouts.ts`)

- **Ruta:** `shared/domain/timeouts.ts`
- **Descripción:** Políticas declarativas de timeout por estado de pedido (PRD §7.6) + interfaz `TimeoutScheduler` + implementación mock con `setTimeout`.
- **API:**
  - `ORDER_TIMEOUT_POLICIES` — const frozen `Partial<Record<OrderStatus, TimeoutPolicy>>` (ENVIADO/RECIBIDO: 10min, ACEPTADO: 2h)
  - `createSetTimeoutScheduler(): TimeoutScheduler` — factory mock (usa `setTimeout`; en producción se reemplaza por cron/Supabase)
  - `TimeoutScheduler.schedule({ orderId, status, onFire }): () => void` — devuelve cleanup (cancela el timer)
- **Tipos exportados:** `TimeoutPolicy`, `ScheduleInput`, `TimeoutScheduler`
- **Nota:** Los estados sin política (terminales, EN_CAMINO) devuelven un no-op cleanup — el caller no necesita verificar si hay política.
- **Usado en:** mock repositories (scheduleTimeout en create/transition), F5 (Supabase-side: cron reemplaza la implementación).

---

## Changelog del registry

| Fecha      | Cambio                                                              | Autor |
| ---------- | ------------------------------------------------------------------- | ----- |
| 2026-04-15 | Creación del registry                                               | —     |
| 2026-04-15 | Migración a estructura `features/` + `shared/` (Opción A auditoría) | —     |
| 2026-04-15 | F0.2: agregada sección 9. Config con `env`                          | —     |
| 2026-04-15 | F0.8: nota sobre `env.*.mjs` actualizada — Next 15 permite unificar | —     |
| 2026-04-16 | F1.1: agregado QueryProvider en sección 2c                          | —     |
| 2026-04-16 | F1.2: agregado queryKeys en sección 2b                              | —     |
| 2026-04-16 | F1.6: agregada sección 10. Stores con `useUIStore`                   | —     |
| 2026-04-16 | F1.3/F1.10: agregado logger en sección 5                            | —     |
| 2026-04-16 | F1.8: agregado `shared/styles/tokens.ts` — design tokens tipados     | —     |
| 2026-04-16 | F1.9: agregadas layout primitives (Stack, Row, Container, Screen, Spacer, Divider) + `polymorphic.types.ts` | —     |
| 2026-04-16 | F1.4: agregada sección 8. Constants — ROUTES, Route, buildHref       | —     |
| 2026-04-16 | F1.7: agregado NuqsProvider en sección 2c                            | —     |
| 2026-04-16 | F3.1: agregada sección 7b. Schemas Zod base; actualizados tipos en §7 para re-exportar desde schemas | —     |
| 2026-04-16 | F3.7: agregados ORDER_STATUS, USER_ROLES y constantes de timeout en sección 8 | —     |
| 2026-04-16 | F3.4: agregada sección 11. Repositories (StoreRepository, OrderRepository, UserRepository, ProductRepository + mocks); orderSchema en §7b; storesService actualizado a delegación via repository | —     |
| 2026-04-16 | F3.3: agregada sección 7c. Domain con ProductSnapshot y snapshot()              | —     |
| 2026-04-16 | F3.2: agregada sección 12. Domain con `order-state-machine`                    | —     |
| 2026-04-16 | F3.5: agregado domain events + event bus en sección 12                         | —     |
| 2026-04-16 | F4.3: agregado parseResponse + ParseError en sección 2b. Query                 | —     |
