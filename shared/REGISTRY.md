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

### Input

- **Ruta:** `shared/components/ui/input.tsx`
- **Descripción:** Campo de texto shadcn con `React.forwardRef`, diseño con tokens (`bg-surface`, `border-border`, `focus-visible:ring-brand`).
- **API:** `<Input type placeholder disabled className ... />` — acepta todos los atributos nativos de `<input>`.
- **Usado en:** formularios de auth (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm).

### Label

- **Ruta:** `shared/components/ui/label.tsx`
- **Descripción:** Label accesible basado en `@radix-ui/react-label` con `cva`. Aplica `text-destructive` si su campo asociado tiene error (integrado con Form).
- **API:** `<Label htmlFor className />` — acepta todos los atributos nativos de `<label>`.
- **Usado en:** `shared/components/ui/form.tsx` (via `FormLabel`).

### Form

- **Ruta:** `shared/components/ui/form.tsx`
- **Descripción:** Sistema completo de formularios shadcn: `Form` (alias de `FormProvider`), `FormField` (wrapper de `Controller`), `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`. Integra `react-hook-form` + Zod via `zodResolver`. `FormLabel` y `FormControl` leen el estado de error automáticamente vía contexto.
- **API:** `<Form><FormField control name render={({ field }) => <FormItem>...} /></Form>`
- **Usado en:** LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm.

### Toaster

- **Ruta:** `shared/components/ui/toaster.tsx`
- **Descripción:** Wrapper `"use client"` sobre `sonner`'s `<Toaster />`. Configurado con `position="bottom-center"`, `richColors`, `closeButton`. Montado en `app/layout.tsx` dentro de `<ThemeProvider>`.
- **API:** `<Toaster />` — sin props. Para disparar toasts usar `import { toast } from "sonner"` directamente.
- **Usado en:** `app/layout.tsx`.

### RadialOrbitalTimeline

- **Ruta:** `shared/components/ui/radial-orbital-timeline.tsx`
- **Descripción:** Timeline radial animado (shadcn/magicui) para mostrar pasos con conexiones orbitales.
- **API:** `<RadialOrbitalTimeline timelineData={TimelineItem[]} />`
- **Usado en:** `features/landing/components/HowItWorks`.
- **⚠️ Excepción §6.5:** 323 líneas — supera el límite de 300. Es una primitiva externa de shadcn/magicui; tocar su estructura interna rompe el contrato del componente. Tratar como dependencia de terceros.

---

## 2. Componentes compuestos (`shared/components/`)

### LiveMiniMap

- **Ruta:** `shared/components/LiveMiniMap/index.ts` (barrel)
- **Archivos:** `LiveMiniMap.tsx`, `MapCanvas.tsx`, `UserMarker.tsx`, `VendorMarker.tsx`, `vendors.ts`
- **Descripción:** Mapa decorativo en tiempo real con marcadores de tiendas ambulantes, radar de usuario, street grid SVG y badges de features. Server Component sin props. Movido desde `features/landing/` para permitir uso en auth pages.
- **API:** `<LiveMiniMap />` — sin props.
- **Sub-tipos:** `MapVendor`, `VendorState`, `LabelSide` exportados desde `vendors.ts`.
- **Usado en:** `features/landing/components/Hero`, `features/auth/components/AuthCard`.

### Icon

- **Ruta:** `shared/components/Icon/Icon.tsx` + `Icon.types.ts` + `index.ts`
- **Descripción:** Wrapper lazy-loaded sobre `lucide-react`. Carga cada icono bajo demanda con `React.lazy` + módulo-level cache (`Map<IconName, LazyExoticComponent>`). Gestiona su propio `<Suspense>` interno con fallback `<span>` del mismo tamaño.
- **API:** `<Icon name size? color? className? aria-label? aria-hidden? />`
  - `name` — `IconName` (union de ~1450 nombres de lucide, con autocomplete y typo-detection)
  - `size` — `"xs" | "sm" | "md" | "lg" | "xl"` (12/16/20/24/32px). Default: `"md"`.
  - `color` — `"inherit" | "brand" | "muted" | "foreground" | "success" | "destructive"`. Default: `"inherit"` (`currentColor`).
- **Constantes exportadas:** `ICON_SIZE`, `ICON_COLOR`, `ICON_STROKE_WIDTH` (1.5)
- **Tipos exportados:** `IconName`, `IconSize`, `IconColor`, `IconProps`
- **Nota:** requiere `"use client"` (React.lazy). Usar dentro de Server Components sin `"use client"` propio — el boundary se toma del primer Client Component ancestro.

### InstallPrompt

- **Ruta barrel:** `shared/components/InstallPrompt/index.ts`
- **Archivos:** `InstallPrompt.tsx` (dumb), `InstallPrompt.container.tsx` (smart, `"use client"`), `InstallPrompt.types.ts`, `InstallPrompt.test.tsx`
- **Descripción:** Prompt de instalación PWA con detección de plataforma (iOS Safari / Android Chrome). En iOS muestra pasos paso a paso para instalar desde Safari (requerido para push notifications). En Android con soporte de `BeforeInstallPromptEvent`, ofrece instalación nativa directa. Persiste el dismiss en localStorage. Renderiza `null` si ya está instalado o si la plataforma es desconocida.
- **API dumb:** `<InstallPrompt platform isInstalled canTriggerNativePrompt onTriggerNativePrompt onDismiss />`
- **API smart:** `<InstallPromptContainer />` — sin props. Detecta plataforma, escucha `beforeinstallprompt`, persiste dismissed en `"ambulante-install-prompt-dismissed"`.
- **Constantes exportadas:** `INSTALL_PLATFORM` — `{ ios, android, unknown }` as const
- **Tipos exportados:** `InstallPlatform`, `InstallPromptProps`, `BeforeInstallPromptEvent`
- **Gotcha:** `BeforeInstallPromptEvent` es una API no estándar de Chromium — tipada localmente, no augmenta `Window` global. `navigator.standalone` (iOS Safari) requiere `@ts-expect-error`.
- **Usado en:** `app/layout.tsx` (a agregar en F6.5+).

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

### Text (tipografía sistematizada)

- **Ruta barrel:** `shared/components/typography/index.ts`
- **Archivos:** `shared/components/typography/Text.tsx`
- **Descripción:** Componente polimórfico de tipografía con variantes semánticas. Reemplaza inline Tailwind en `h1/h2/h3/p/span`. Cada variante lleva sus clases de fuente, tamaño, peso y tracking baked-in; el color y espaciado se pasan via `className`.
- **API:** `<Text variant="..." as?: ElementType className? {...htmlAttrs} />`
  - `as` acepta cualquier tag HTML intrínseco (`"div"`, `"article"`, `"li"`…) o componente React. Default: `"span"`.
- **Elementos por defecto:** `display-xl→h1`, `display-lg→h2`, `heading-sm→h3`, `body/body-sm→p`, `overline/caption→span`
- **Nota `heading-sm`:** es neutral en casing — no bake `uppercase`. Callers añaden `className="uppercase"` cuando lo necesitan (ej: Features) y lo omiten cuando no (ej: StoreCard). Esto es intencional.
- **Nota `display-xl`:** incluye breakpoints responsivos baked-in (`sm:text-6xl lg:text-7xl xl:text-8xl`). `cn()` usa `tailwind-merge` así que se pueden sobreescribir via `className`.
- **Tipo exportado:** `TextVariant`
- **Usado en:** `features/landing/Hero`, `features/landing/HowItWorks`, `features/landing/Features`, `features/map/StoreCard`, `shared/components/typography/SectionHeader`.

### SectionHeader

- **Ruta:** `shared/components/typography/SectionHeader.tsx`
- **Descripción:** Bloque compuesto de eyebrow (`overline`) + título (`display-lg`). Promovido desde `features/landing/HowItWorks` al ser usado en 2+ lugares.
- **API:** `<SectionHeader eyebrow="..." title="..." />`
- **Usado en:** `features/landing/HowItWorks`, `features/landing/Features`.

---

## 2b. Query (`shared/query/`)

### queryKeys

- **Ruta:** `shared/query/keys.ts`
- **Descripción:** Registro centralizado de query key factories para React Query v5. Organizado por dominio con jerarquía para invalidación parcial.
- **API:** `queryKeys.stores.all()`, `queryKeys.stores.nearby(coords, radiusMeters)`, `queryKeys.stores.byId(id)`, `queryKeys.stores.profile(storeId)`, `queryKeys.orders.all()`, `queryKeys.orders.byUser(userId)`, `queryKeys.orders.byId(id)`, `queryKeys.products.all()`, `queryKeys.products.byStore(storeId)`, `queryKeys.catalog.byStore(storeId)`, `queryKeys.catalog.byId(id)`
- **Nota:** `products.*` = catálogo read-only (client-facing). `catalog.*` = catálogo CRUD (store owner). Namespaces separados; mutaciones de catálogo solo invalidan `catalog.*`.
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

### useRealtimeInvalidation

- **Ruta:** `shared/query/useRealtimeInvalidation.ts`
- **Descripción:** Hook bridge que conecta `realtimeService.subscribe` con `queryClient.invalidateQueries`. Se suscribe al canal en mount, invalida `queryKey` en cada mensaje, y desuscribe en unmount. Usa `useRef` para capturar la queryKey sin re-disparar el efecto en cada render.
- **API:** `useRealtimeInvalidation({ channel: string, queryKey: readonly unknown[] }): void`
- **Nota:** solo re-subscribe cuando cambia `channel`. `queryKey` se actualiza via ref — no es una dependencia del efecto.
- **Usado en:** `features/orders/components/OrderTracking/OrderTracking.container.tsx`.

---

## 2c. Providers (`shared/providers/`)

### QueryProvider

- **Ruta:** `shared/providers/QueryProvider.tsx`
- **Descripción:** Envuelve la app con `QueryClientProvider` de React Query v5. Crea un `QueryClient` estable por instancia con defaults de staleTime (30s), gcTime (5min), retry inteligente (backoff exponencial, sin retry en 4xx, máx 3 intentos), retryDelay exponencial acotado (1s→30s), `networkMode: 'offlineFirst'` para PWA, y `refetchOnWindowFocus: false`. Monta `ReactQueryDevtools` solo en `NODE_ENV === "development"`.
- **API:** `<QueryProvider>{children}</QueryProvider>`
- **Exports auxiliares:** `isClientError(error)`, `computeRetryDelay(attemptIndex)`, `shouldRetry(failureCount, error)` — exportadas para testabilidad.
- **Usado en:** `app/layout.tsx`.

### NuqsProvider

- **Ruta:** `shared/providers/NuqsProvider.tsx`
- **Descripción:** Adaptador de `nuqs` para Next.js App Router. Necesario para que cualquier hook `useQueryState` / `useQueryStates` funcione. Envuelve toda la app en `app/layout.tsx`.
- **API:** `<NuqsProvider>{children}</NuqsProvider>`
- **Usado en:** `app/layout.tsx`, `features/map/hooks/useRadiusParam`.

---

## 3. Hooks (`shared/hooks/`)

> Feature-local query hooks live in `features/<name>/hooks/`. They follow the canonical `useXxxQuery` pattern documented in `docs/recipes/query-hook-pattern.md`.

### useStoreProfileQuery _(feature-local — store-profile)_

- **Ruta:** `features/store-profile/hooks/useStoreProfileQuery.ts`
- **Descripción:** Fetches the store profile for a given `storeId` using React Query v5 `useQuery`. Disabled automatically when `storeId` is `null` or empty. Logs errors with context on failure.
- **API:** `useStoreProfileQuery(storeId: string | null)` → `UseQueryResult<StoreProfile>`
- **Query key:** `queryKeys.stores.profile(storeId)`
- **Service:** `features/store-profile/services/store-profile.mock.ts` — `storeProfileService.getProfile(storeId)`.
- **Usado en:** `features/store-profile/components/StoreProfilePage/StoreProfilePage.container.tsx`.

### useUpdateStoreProfileMutation _(feature-local — store-profile)_

- **Ruta:** `features/store-profile/hooks/useUpdateStoreProfileMutation.ts`
- **Descripción:** Canonical `useXxxMutation` hook con optimistic update. `onMutate` snapshot + optimistic write; `onError` rollback + `logger.error`; `onSettled` `invalidateQueries`. Input: `UpdateStoreProfileInput` (partial).
- **API:** `useUpdateStoreProfileMutation(storeId: string)` → `UseMutationResult`; call `mutate(input)`.
- **Service:** `features/store-profile/services/store-profile.mock.ts` — `storeProfileService.updateProfile(storeId, input)`.
- **Usado en:** `features/store-profile/components/StoreProfilePage/StoreProfilePage.container.tsx`.

### useOrderQuery _(feature-local — orders)_

- **Ruta:** `features/orders/hooks/useOrderQuery.ts`
- **Descripción:** Fetches a single order by ID using React Query v5 `useQuery`. Returns `Order | null` (null when not found). Used by `OrderTrackingContainer` for the live tracking screen.
- **API:** `useOrderQuery(orderId: string)` → `UseQueryResult<Order | null>`
- **Query key:** `queryKeys.orders.byId(orderId)`
- **Service:** `ordersService.getById(orderId)` from `features/orders/services/orders.mock.ts`.
- **Usado en:** `features/orders/components/OrderTracking/OrderTracking.container.tsx`.

### useSendOrderMutation _(feature-local — orders)_

- **Ruta:** `features/orders/hooks/useSendOrderMutation.ts`
- **Descripción:** Mutation hook para enviar un nuevo pedido (crea en estado `ENVIADO`). Invalida `orders.all()` on success. Loguea errores con `logger.error`. Input: `SendOrderInput = { storeId, items, notes? }`.
- **API:** `useSendOrderMutation()` → `UseMutationResult`; call `mutate({ storeId, items })`.
- **Service:** `ordersService.send(input)` — crea snapshot inmutable de productos al momento del pedido (PRD §7.4).
- **Usado en:** futuras features de checkout / CartSummaryBar.

### useAcceptOrderMutation _(feature-local — orders)_

- **Ruta:** `features/orders/hooks/useAcceptOrderMutation.ts`
- **Descripción:** Canonical `useXxxMutation` hook. Accepts an order on behalf of the store using React Query v5 `useMutation` with optimistic updates. On `onMutate`, pre-emptively sets the order status to `ACEPTADO` in the cache; rolls back on `onError`; invalidates `orders.byId` and `orders.all` on `onSettled`.
- **API:** `useAcceptOrderMutation()` — returns `useMutation` result; call `mutate(orderId)`.
- **Returns:** `{ mutate, isPending, isError, isSuccess, data }`
- **Service:** `features/orders/services/orders.mock.ts` — `ordersService.accept(orderId)` (stub; replace with real API).
- **Pattern doc:** `docs/recipes/mutation-hook-pattern.md`
- **Usado en:** F4.2 reference; future store-dashboard feature.

### useStoreByIdQuery _(feature-local — map)_

- **Ruta:** `features/map/hooks/useStoreByIdQuery.ts`
- **Descripción:** Fetches a single store by ID. Disabled when `storeId` is `null`. Logs errors via `logger.error`. Returns the full React Query result.
- **API:** `useStoreByIdQuery(storeId: string | null)`
- **Query key:** `queryKeys.stores.byId(storeId)` when active.
- **Usado en:** `features/map/components/StoreDetailSheet/StoreDetailSheet.container.tsx`.

### useStoreProductsQuery _(feature-local — map)_

- **Ruta:** `features/map/hooks/useStoreProductsQuery.ts`
- **Descripción:** Fetches the product catalog for a store. Disabled when `storeId` is `null`. Logs errors via `logger.error`.
- **API:** `useStoreProductsQuery(storeId: string | null)`
- **Query key:** `queryKeys.products.byStore(storeId)` when active.
- **Usado en:** `features/map/components/StoreDetailSheet/StoreDetailSheet.container.tsx`.

### useStoresNearbyQuery _(feature-local — map)_

- **Ruta:** `features/map/hooks/useStoresNearbyQuery.ts`
- **Descripción:** Canonical `useXxxQuery` hook. Fetches stores near given coordinates using React Query v5 `useQuery`. Disabled automatically when `coords` is `null` (`enabled: coords !== null`). Returns the full React Query result object; consumers destructure `{ data: stores = [], isLoading, isError }`.
- **API:** `useStoresNearbyQuery({ coords: Coordinates | null, radius: RadiusValue })`
- **Query key:** `queryKeys.stores.nearby(coords, radius)` when coords present; `queryKeys.stores.all()` when disabled.
- **Replaces:** `features/map/hooks/useNearbyStores.ts` (manual `useState+useEffect` pattern — deprecated).
- **Usado en:** `features/map/components/MapScreen.container.tsx`.

### useSession

- **Ruta:** `shared/hooks/useSession.ts`
- **Descripción:** Hook de autenticación. Obtiene la sesión actual al montar, suscribe a cambios de auth vía `onAuthStateChange`, y expone `signIn`/`signUp`/`signOut`. Acepta una instancia de `AuthService` (default: singleton `authService`) para facilitar tests.
- **API:** `useSession(service?): SessionState & { signIn, signUp, signOut }`
- **Estados:** `loading | authenticated | unauthenticated | error`
- **Tipo discriminado:** `SessionState` — cuando `status === "authenticated"` expone `session: Session`.
- **Usado en:** layouts de route groups protegidos (F2.4+), `middleware.ts`, `features/admin-shell/components/AdminShell/AdminShell.container.tsx`.

### useGeolocation

- **Ruta:** `shared/hooks/useGeolocation.ts`
- **Descripción:** Obtiene la posición actual del navegador con filtrado de precisión (PRD §7.1). Retorna un discriminated union `GeoState`.
- **API:** `useGeolocation(): GeoState & { request: () => void }`
- **Estados:** `idle | loading | granted | denied | error`
- **Usado en:** `features/map/components/MapScreen.container`.

---

## 4. Services (`shared/services/`)

> Clientes de datos. Hoy devuelven mocks; mañana apuntarán a la API real. Los componentes consumen services, nunca mocks directos.

### authService

- **Ruta:** `shared/services/auth.ts`
- **Tipos:** `shared/services/auth.types.ts`
- **Descripción:** Implementación mock de `AuthService` (DP-2 Supabase Auth). Gestiona sesión en memoria, pre-seed 3 usuarios de prueba (`client/store/admin @test.com`, password `"password"`). Swap a Supabase: reemplazar solo esta implementación sin tocar consumers.
- **Interface:** `AuthService` — `signIn(input)`, `signUp(input)`, `signOut()`, `getSession()`, `onAuthStateChange(cb)`
- **Tipos clave:** `SignInInput`, `SignUpInput`, `AuthResult<T>`, `AuthStateChangeCallback`
- **Usado en:** `shared/hooks/useSession`, F2.4 middleware.

### realtimeService

- **Ruta:** `shared/services/realtime.ts`
- **Tipos:** `shared/services/realtime.types.ts`
- **Descripción:** Abstracción de transporte realtime. Interfaz `RealtimeService` swapeable (mock in-memory hoy → Supabase Realtime cuando llegue el backend). Se integra con el `eventBus` via `registerSerializationHook`: los domain events publicados al bus fluyen automáticamente al canal `"orders"`. Arranca en estado `"online"`.
- **Interface:** `RealtimeService` — `subscribe(channel, handler)` → `() => void`, `unsubscribe(channel)`, `status()` → `RealtimeStatus`, `onStatusChange(handler)` → `() => void`, `destroy()`
- **Factory exportada:** `createMockRealtimeService(options?)` — recibe `eventBus` opcional (para tests con bus aislado)
- **Canales:** `REALTIME_CHANNELS` as const — `{ orders: "orders", stores: "stores" }`
- **Tipos clave:** `RealtimeStatus` ("connecting" | "online" | "offline"), `RealtimeMessage<T>`, `RealtimeHandler<T>`, `RealtimeStatusHandler`, `RealtimeChannel`
- **Usado en:** F5.3 (`useRealtimeInvalidation`), F5.4 (reconnect hook).

### storesService

- **Ruta:** `shared/services/stores.ts`
- **Descripción:** Cliente de tiendas detrás de una interfaz `StoresService`. Delega a `storeRepository` (F3.4). Swap a Supabase → solo cambiar el repository, sin tocar consumers.
- **API:** `findNearby({ coords, radiusMeters })`, `findById(id)`
- **Tipos:** `StoresService`, `FindNearbyInput` re-exportados desde `shared/repositories/store`
- **Usado en:** `features/map/hooks/useStoresNearbyQuery`, `features/map/hooks/useStoreByIdQuery`.

### productsService

- **Ruta:** `shared/services/products.ts`
- **Tipos:** `shared/services/products.types.ts`
- **Descripción:** Cliente de productos detrás de `ProductsService`. Delega a `productRepository`. Swap a Supabase → reemplazar solo esta implementación.
- **API:** `findByStore(storeId: string): Promise<readonly Product[]>`
- **Tipo:** `ProductsService`
- **Usado en:** `features/map/hooks/useStoreProductsQuery`.

---

## 5. Utils (`shared/utils/`)

> Funciones puras genéricas. Sin efectos secundarios.

### parseSessionCookie, serializeSessionCookie, writeSessionCookie, clearSessionCookie

- **Ruta:** `shared/utils/session-cookie.ts`
- **Descripción:** Serializa/deserializa una `Session` como cookie value base64-encoded. Edge-safe (solo usa `atob`/`btoa` + Zod). `parseSessionCookie` retorna `null` si el valor está vacío, es base64 inválido, JSON inválido, expirado, o no satisface `sessionSchema`. Exporta `SESSION_COOKIE_OPTIONS` con flags de seguridad. `writeSessionCookie`/`clearSessionCookie` escriben/borran la cookie desde el browser (`document.cookie`) — MOCK PHASE ONLY, sin `httpOnly`.
- **API:** `parseSessionCookie(cookieValue: string): Session | null` · `serializeSessionCookie(session: Session): string` · `SESSION_COOKIE_OPTIONS` · `writeSessionCookie(session: Session): void` · `clearSessionCookie(): void`
- **Usado en:** `middleware.ts`, `shared/services/auth.ts` (signIn/signUp/signOut).

### getRequiredRole

- **Ruta:** `shared/utils/route-access.ts`
- **Descripción:** Función pura que mapea un `pathname` al `UserRole` requerido para accederlo. Retorna `null` para rutas públicas. Exportada por separado del middleware para ser unit-testable sin `NextRequest`.
- **API:** `getRequiredRole(pathname: string): UserRole | null`
- **Mapeo:** `/map*` → `client` · `/store*` → `store` · `/admin*` → `admin` · resto → `null`
- **Usado en:** `middleware.ts`.

### extractErrorMessage

- **Ruta:** `shared/utils/errorMessage.ts`
- **Descripción:** Mapea un `unknown` error a un mensaje de texto en español (`string`) o `null`. Retorna `null` para errores 4xx (manejados en-feature). Retorna una cadena fallback para 5xx/red.
- **API:** `extractErrorMessage(error: unknown, context?: "query" | "mutation"): string | null`
- **Usado en:** `shared/providers/QueryProvider.tsx` (QueryCache.onError + mutations.onError).

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
- **Descripción:** Single source of truth de design tokens tipados. Exporta `COLORS`, `RADIUS`, `SHADOWS`, `MOTION`, `TYPOGRAPHY`, `FONT_SIZE`, `HEIGHTS`, `WIDTHS`, `MAX_WIDTHS`, `MIN_WIDTHS`, `LINE_HEIGHTS`, `LETTER_SPACINGS`, `BLUR_TOKENS`.
- **API:** `import { COLORS, RADIUS, SHADOWS, MOTION, TYPOGRAPHY, FONT_SIZE, HEIGHTS, WIDTHS, MAX_WIDTHS, MIN_WIDTHS, LINE_HEIGHTS, LETTER_SPACINGS, BLUR_TOKENS } from '@/shared/styles/tokens'`
- **Usado en:** `tailwind.config.ts` (via import relativo — los path aliases no aplican en ese contexto Node.js)
- **Grupos de tokens (F9.1):**
  - `FONT_SIZE` — escala tipográfica: `3xs` (9px), `2xs` (10px), `xs-tight` (11px), `xs-loose` (13px), `display-hero` (clamp 2rem→3.5rem), `display-auth` (40px)
  - `HEIGHTS` — alturas semánticas: `screen-dvh` (100dvh), `sheet-collapsed/half/full`, `orb-lg`
  - `WIDTHS` — anchos semánticos: `nav-description`, `nav-sm`, `nav-md`, `orb-lg`
  - `MAX_WIDTHS` — anchos máximos: `content-sm` (260px), `content-md` (320px)
  - `MIN_WIDTHS` — anchos mínimos: `chip` (48px)
  - `LINE_HEIGHTS` — interlineado: `display` (0.95), `tight-xl` (0.9)
  - `LETTER_SPACINGS` — tracking: `tag` (0.14em), `eyebrow` (0.2em), `display` (-0.02em)
  - `BLUR_TOKENS` — radios de blur: `orb` (100px), `ambient` (120px)
  - `SHADOWS` extendido — sombras: `pin`, `card-brutal`, `card-brutal-hover`, `sheet`
- **Nota:** `COLORS.raw.light` / `COLORS.raw.dark` son los valores crudos HSL para uso runtime. `COLORS.cssVarRefs` contiene las references `hsl(var(--token))` para el config de Tailwind.

### contrast

- **Ruta:** `shared/styles/contrast.ts`
- **Descripción:** Utilidades WCAG para calcular luminancia relativa y ratio de contraste desde valores HSL. Exporta `WCAG_THRESHOLDS` (normalText: 4.5, largeText: 3.0), `parseHsl`, `hslToLuminance`, `contrastRatio`.
- **API:** `import { WCAG_THRESHOLDS, parseHsl, hslToLuminance, contrastRatio } from '@/shared/styles/contrast'`
- **Tipos exportados:** `HslColor — { h: number; s: number; l: number }`
- **Nota:** `parseHsl` acepta el formato "H S% L%" que usan los tokens en `COLORS.raw`. Usado en `contrast.test.ts` para auditorías WCAG AA.

### motion

- **Ruta:** `shared/styles/motion.ts`
- **Descripción:** Primitivas de animación derivadas de `MOTION` en tokens.ts. Exporta duraciones en segundos para framer-motion, cubic-bezier easing arrays, transition presets reutilizables, variant presets (fade/slide), y Tailwind class helpers para CSS transitions.
- **API:**
  - `FM_DURATIONS` — `{ fast, base, slow }` en segundos
  - `FM_EASINGS` — `{ easeOut, easeInOut, linear }` como `[number, number, number, number]`
  - `TRANSITIONS` — `{ fast, base, slow, spring }` como objetos listos para pasar a `transition=` de motion.* components
  - `FADE_IN_VARIANTS`, `SLIDE_UP_VARIANTS`, `SLIDE_DOWN_VARIANTS` — objetos `{ initial, animate, exit }` para `variants=`
  - `TW_TRANSITIONS` — `{ fast, base, slow }` como strings de clases Tailwind (`"transition duration-200 ease-out"`)
- **Tipos exportados (internos):** `MotionTransition`, `MotionVariants` — compatibles con `motion/react` para cuando se instale el paquete.
- **Usado en:** cualquier componente que necesite animaciones consistentes.

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

### User, UserRole, Session

- **Ruta:** `shared/types/user.ts` (re-export de `@/shared/schemas/user`)
- **Descripción:** Usuario autenticado con rol (`client` | `store` | `admin`). `Session` modela la sesión de Supabase Auth: `accessToken`, `refreshToken`, `expiresAt` (Unix timestamp positivo), `user`.
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
- **Descripción:** Schemas de tienda ambulante; usa `coordinatesSchema` para el campo `location`. Campos opcionales: `description` (texto largo de la tienda) y `hours` (horarios como string legible).
- **API:** `storeSchema.parse(raw)` → `Store`; `storeKindSchema.options` para iterar valores.

### productSchema, Product

- **Ruta:** `shared/schemas/product.ts`
- **Descripción:** Producto del catálogo (precio, disponibilidad, storeId). `photoUrl` y `description` opcionales.
- **API:** `productSchema.parse(raw)` → `Product`

### userRoleSchema, userSchema, sessionSchema

- **Ruta:** `shared/schemas/user.ts`
- **Descripción:** Usuario con roles `client | store | admin`. `displayName` opcional. `sessionSchema` valida sesiones de Supabase Auth (accessToken, refreshToken, expiresAt positivo, user anidado).
- **API:** `userSchema.parse(raw)` → `User`; `sessionSchema.parse(raw)` → `Session`; `userRoleSchema.options` para iterar roles.

### storeProfileSchema, updateStoreProfileSchema, StoreProfile, UpdateStoreProfileInput

- **Ruta:** `features/store-profile/schemas/store-profile.schemas.ts`
- **Descripción:** Schemas Zod del perfil de tienda (F13.6). `storeProfileSchema` valida el modelo completo con `.refine()` que garantiza `closeTime > openTime`. `updateStoreProfileSchema` es la versión `.omit({ storeId }).partial()` para edición parcial.
- **API:** `zodResolver(updateStoreProfileSchema)` en `StoreProfileForm`; tipos inferidos `StoreProfile`, `UpdateStoreProfileInput`.
- **Tipos exportados:** `StoreProfile`, `UpdateStoreProfileInput`, `ProfileDay`, `PROFILE_DAYS`
- **Constante:** `PROFILE_DAYS` — array readonly de los 7 días en español (alineado con `STORE_ONBOARDING_DAYS` pero feature-local por aislamiento).
- **Nota:** esquema de feature — no en `shared/` porque solo lo consume `features/store-profile`.

### stepFiscalSchema, stepZoneSchema, stepHoursSchema, storeOnboardingSchema

- **Ruta:** `features/store-onboarding/schemas/store-onboarding.schemas.ts`
- **Descripción:** Schemas Zod para el wizard de onboarding de tienda (F2.9). `stepFiscalSchema` valida nombre del negocio, tipo (`storeKindSchema`) y CUIT (11 dígitos). `stepZoneSchema` valida barrio y notas opcionales. `stepHoursSchema` valida días (`STORE_ONBOARDING_DAYS`) y horarios `HH:MM`. `storeOnboardingSchema` es la fusión de los tres para validar el payload final antes de enviar.
- **API:** `zodResolver(stepFiscalSchema)` en cada step form; `storeOnboardingSchema.safeParse({ ...fiscalDraft, ...zoneDraft, ...hoursDraft })` en el container antes de llamar al servicio.
- **Tipos exportados:** `StepFiscalValues`, `StepZoneValues`, `StepHoursValues`, `StoreOnboardingData`, `OnboardingDay`
- **Constante:** `STORE_ONBOARDING_DAYS` — array readonly de los 7 días en español.
- **Nota:** esquema de feature — no en `shared/` porque solo lo consume `features/store-onboarding`.

### loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema

- **Ruta:** `features/auth/schemas/auth.schemas.ts`
- **Descripción:** Schemas Zod para los 4 formularios de auth. `registerSchema` y `resetPasswordSchema` incluyen refinement `.refine()` para validar que `password === confirmPassword`. `resetPasswordSchema` incluye el campo `token` (string no vacío). Exporta los tipos inferidos `LoginValues`, `RegisterValues`, `ForgotPasswordValues`, `ResetPasswordValues`.
- **API:** `zodResolver(loginSchema)` en `useForm`; `LoginValues` como tipo del `handleSubmit` handler.
- **Nota:** estos schemas son de feature (`features/auth/`), no de `shared/` — pero se listan aquí por ser la fuente de verdad de los tipos de los formularios de auth.

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

### QUERY_ERROR_MESSAGE, MUTATION_ERROR_MESSAGE

- **Ruta:** `shared/constants/ui-messages.ts`
- **Descripción:** Mensajes de error en español para mostrar al usuario. `QUERY_ERROR_MESSAGE` para fallos de fetch; `MUTATION_ERROR_MESSAGE` para fallos de acción. Reemplaza magic strings en `extractErrorMessage`.
- **Usado en:** `shared/utils/errorMessage.ts`.

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
- **Descripción:** Árbol tipado de todas las rutas de la app por rol (`public`, `auth`, `client`, `store`, `admin`). `ROUTES` es `as const` — el compilador detecta typos en rutas. `buildHref(template, params?)` interpola segmentos `:param` tipados.
- **API:** `ROUTES.auth.login`, `ROUTES.auth.register`, `ROUTES.auth.registerStore`, `ROUTES.auth.forgotPassword`, `ROUTES.auth.resetPassword`, `ROUTES.client.map`, `ROUTES.client.orders`, `ROUTES.client.profile`, `ROUTES.store.dashboard`, `ROUTES.store.orders`, `ROUTES.store.catalog`, `ROUTES.store.profile`, `ROUTES.store.pendingApproval`, `buildHref(ROUTES.store.order, { orderId: "x" })`
- **Tipo:** `Route` = unión de todos los strings leaf de `ROUTES`.
- **Usado en:** `features/landing/*` (migrables), `features/client-shell/*`, `features/store-shell/components/StoreNav`, cualquier `<Link>` o `router.push`.

### ORDER_STATUS, OrderStatus, TERMINAL_ORDER_STATUSES, ORDER_EXPIRATION_MINUTES, ORDER_AUTOCLOSE_HOURS

- **Ruta:** `shared/constants/order.ts`
- **Descripción:** Constantes del dominio de pedidos. `ORDER_STATUS` es un objeto frozen `as const` con los 8 estados de la máquina de estados (PRD §6.1). `TERMINAL_ORDER_STATUSES` es un array readonly de los 3 estados terminales. Los timeouts siguen §9.2 del PRD.
- **API:** `ORDER_STATUS.ACEPTADO`, `TERMINAL_ORDER_STATUSES`, `ORDER_EXPIRATION_MINUTES` (10), `ORDER_AUTOCLOSE_HOURS` (2)
- **Tipo exportado:** `OrderStatus` = unión literal de todos los valores de `ORDER_STATUS`.
- **Usado en:** máquina de estados (F3.2), transiciones de pedido, guards de inmutabilidad en estados terminales.

### SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS

- **Ruta:** `shared/constants/auth.ts`
- **Descripción:** Constantes de la cookie de sesión: nombre (`ambulante-session`) y max-age en segundos (3600 = 1h).
- **Usado en:** `shared/utils/session-cookie.ts`, `middleware.ts`, futuros hooks de signIn/signOut.

### USER_ROLES

- **Ruta:** `shared/constants/user.ts`
- **Descripción:** Roles de usuario del sistema (PRD §4). Objeto frozen `as const` con los 3 roles. Valores alineados con `UserRole` del schema Zod.
- **API:** `USER_ROLES.client`, `USER_ROLES.store`, `USER_ROLES.admin`
- **Tipo `UserRole`:** importar desde `@/shared/schemas/user` o `@/shared/types/user` — no re-exportado desde constants para evitar colisión.
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

### useCartStore

- **Ruta:** `shared/stores/cart.ts`
- **Descripción:** Estado global del carrito de compras. Persiste en localStorage. Soporta un único `activeStoreId` — agregar un producto de otra tienda limpia el carrito actual (invariante de aislamiento de tienda). `CartItem` extiende `OrderItem` con `storeId` para detección interna.
- **API:**
  - Estado: `activeStoreId: string | null`, `items: readonly CartItem[]`
  - Acciones: `addItem(product, storeId)`, `removeItem(productId)`, `clearCart()`, `totalItems(): number`
- **Persistencia:** `ambulante-cart` en localStorage (solo state, sin acciones).
- **Tipo exportado:** `CartItem = OrderItem & { storeId: string }`
- **Usado en:** futuras features de checkout; CartSummaryBar.

### useUIStore

- **Ruta:** `shared/stores/ui.ts`
- **Descripción:** Preferencias de UI persistidas en localStorage. Incluye `theme` (light/dark/system) y `isSidebarOpen`.
- **API:**
  - Estado: `theme: Theme`, `isSidebarOpen: boolean`
  - Acciones: `setTheme(theme)`, `toggleSidebar()`, `setSidebarOpen(isOpen)`
- **Persistencia:** `ambulante-ui-preferences` en localStorage (solo state, sin acciones).
- **Tipo re-exportado:** `Theme = "light" | "dark" | "system"`
- **Usado en:** ThemeProvider, `features/admin-shell/components/AdminShell/AdminShell.container.tsx`.

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

## 13. Features (`features/`)

> Shell de roles y bloques de UI específicos que no son candidatos a `shared/` porque pertenecen a un solo contexto de rol. Se documentan acá para evitar reimplementaciones.

### OrderTracking (F12.4)

- **Ruta barrel:** `features/orders/components/OrderTracking/index.ts`
- **Archivos:** `OrderTracking.tsx` (dumb), `OrderTracking.container.tsx` (smart), `OrderTracking.types.ts`
- **Descripción:** Pantalla de seguimiento de un pedido en tiempo real. Timeline de 5 pasos (ENVIADO→RECIBIDO→ACEPTADO→EN_CAMINO→FINALIZADO) con `data-testid`, `data-current`, `data-completed`. Estados terminales (CANCELADO/RECHAZADO/EXPIRADO) muestran mensaje en lugar del timeline. CTAs por estado: cancelar (ENVIADO/RECIBIDO), confirmar en camino (ACEPTADO), ninguno (EN_CAMINO/FINALIZADO/terminales).
- **API dumb:** `<OrderTracking order onConfirmOnTheWay onCancel isCancelling isConfirmingOnTheWay />`
- **API smart:** `<OrderTrackingContainer orderId />` — usa `useOrderQuery` + `useRealtimeInvalidation` para invalidación en tiempo real.
- **Ruta app:** `app/(client)/orders/[id]/page.tsx`
- **Tipos exportados:** `OrderTrackingProps`
- **Usado en:** `app/(client)/orders/[id]/page.tsx`.

### StoreDetailSheet (F12.1)

- **Ruta barrel:** `features/map/components/StoreDetailSheet/index.ts`
- **Archivos:** `StoreDetailSheet.tsx` (dumb), `StoreDetailSheet.container.tsx` (smart), `StoreDetailSheet.types.ts`
- **Descripción:** Bottom sheet overlay que muestra el detalle de una tienda seleccionada. Incluye foto, nombre, tagline, descripción, horarios, y catálogo de productos. Se renderiza sobre el mapa, reemplazando el `NearbyBottomSheet` cuando hay una tienda seleccionada.
- **API dumb:** `<StoreDetailSheet store products isLoadingProducts onDismiss />`
- **API smart:** `<StoreDetailSheetContainer storeId onDismiss />` — carga store + products, renderiza null si store no encontrado.
- **Tipos exportados:** `StoreDetailSheetProps`, `StoreDetailSheetContainerProps`
- **Usado en:** `features/map/components/MapScreen.tsx` (condicional sobre `selectedStoreId`).

### store-shell — Shell del rol Tienda

- **Ruta barrel:** `features/store-shell/index.ts`
- **Componentes:**
  - `StoreShell` (`features/store-shell/components/StoreShell/StoreShell.tsx`) — dumb, Server Component compatible. Props: `children`, `isAvailable: boolean`, `onToggleAvailability: () => void`, `isSidebarOpen: boolean`, `onToggleSidebar: () => void`. Layout responsive (bottom bar mobile / sidebar izquierdo desktop) con un único DOM tree.
  - `StoreShellContainer` (`features/store-shell/components/StoreShell/StoreShell.container.tsx`) — `"use client"`, conecta `useUIStore` (sidebar) + `useAvailability`. Usado en `app/(store)/layout.tsx`.
  - `StoreNav` (`features/store-shell/components/StoreNav/StoreNav.tsx`) — nav dumb con 4 items: Dashboard, Pedidos, Catálogo, Perfil. Props: `currentPath?: string` (resalta item activo).
  - `AvailabilityToggle` (`features/store-shell/components/AvailabilityToggle/AvailabilityToggle.tsx`) — switch accesible (`role="switch"`, `aria-checked`). Props: `isAvailable: boolean`, `onToggle: () => void`.
- **Hooks:**
  - `useAvailability` (`features/store-shell/hooks/useAvailability.ts`) — estado local de disponibilidad. Retorna `{ isAvailable, toggle, setAvailable }`.
- **Usado en:** `app/(store)/layout.tsx`.

### store-profile — Perfil de la tienda

- **Ruta barrel:** `features/store-profile/index.ts`
- **Componentes:**
  - `StoreProfilePage` (`features/store-profile/components/StoreProfilePage/StoreProfilePage.tsx`) — dumb, renderiza `StoreProfileForm` con un heading. Props: `profile: StoreProfile`, `onSave: (data: UpdateStoreProfileInput) => void`, `isSaving: boolean`.
  - `StoreProfilePageContainer` (`features/store-profile/components/StoreProfilePage/StoreProfilePage.container.tsx`) — `"use client"`, conecta `useStoreProfileQuery` + `useUpdateStoreProfileMutation`. Maneja loading/error states. Exportado como entry point en `features/store-profile/index.ts`.
  - `StoreProfileForm` (`features/store-profile/components/StoreProfileForm/StoreProfileForm.tsx`) — `"use client"` dumb form. react-hook-form + `zodResolver(updateStoreProfileSchema)`. Campos: businessName, kind (select), neighborhood, coverageNotes (opcional), days (button toggles), openTime/closeTime (time inputs en grid).
- **Hooks:** `useStoreProfileQuery`, `useUpdateStoreProfileMutation` — ver §3.
- **Service:** `storeProfileService` en `features/store-profile/services/store-profile.mock.ts` — interfaz `StoreProfileService` (`getProfile`, `updateProfile`), mock con in-memory state y 300ms de latencia simulada. `MOCK_STORE_ID = "dona-rosa"`.
- **Schemas:** `storeProfileSchema`, `updateStoreProfileSchema` — ver §7b.
- **Ruta app:** `app/(store)/profile/page.tsx`
- **Usado en:** `app/(store)/profile`.

---

## 14. Test utilities (`shared/test-utils/`)

> Solo para archivos `*.test.{ts,tsx}`. No importar desde código de producción.

### renderWithProviders + createTestQueryClient

- **Ruta barrel:** `shared/test-utils/index.ts`
- **Ruta impl:** `shared/test-utils/render.tsx`
- **Descripción:** Helper que envuelve componentes con todos los providers de la app (`QueryClientProvider`, `NuqsAdapter`, `ThemeProvider`) para tests de componentes. `createTestQueryClient()` crea un `QueryClient` sin retries y `staleTime: Infinity` para tests deterministas. El barrel re-exporta todo de `@testing-library/react` y `userEvent` de `@testing-library/user-event`.
- **API:**
  - `renderWithProviders(ui, options?)` — `options.queryClient?: QueryClient` para pre-sembrar datos en caché
  - `createTestQueryClient(): QueryClient` — fábrica de cliente aislado por test
  - `userEvent` — re-export de `@testing-library/user-event`
  - Toda la API de `@testing-library/react` (screen, fireEvent, waitFor, etc.)
- **Uso canónico:**
  ```ts
  import { renderWithProviders, screen, userEvent } from '@/shared/test-utils';
  ```
- **Nota:** Usa `nuqs/adapters/react` (no el adaptador Next.js) para compatibilidad con jsdom.

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
| 2026-04-16 | F3.6: agregado timeout policies + scheduler en sección 12                      | —     |
| 2026-04-16 | F2.2: agregado `sessionSchema` + `Session` type en §7/7b; `USER_ROLES` corregido a valores en inglés (`client/store/admin`) en §8; eliminada colisión de tipo `UserRole` en constants | —     |
| 2026-04-16 | F2.3: agregado `authService` + `AuthService` interface en §4; `useSession` hook en §3 | —     |
| 2026-04-16 | F2.4: agregado `SESSION_COOKIE_NAME/MAX_AGE` en §8; `parseSessionCookie`/`serializeSessionCookie` + `getRequiredRole` en §5 | —     |
| 2026-04-16 | F2.5: ROUTES.client extendido con `orders` y `profile`; `afterEach(cleanup)` añadido al setup global | —     |
| 2026-04-16 | F2.6: ROUTES.store expandido (orders/catalog/profile); agregada sección 13. Features con store-shell | —     |
| 2026-04-16 | F4.1: agregado useStoresNearbyQuery en §3; storesService consumer actualizado a useStoresNearbyQuery | —     |
| 2026-04-16 | F2.7: `useUIStore` y `useSession` — "Usado en" actualizado con admin-shell container                  | —     |
| 2026-04-16 | F2.8: agregados Input, Label, Form UI primitives en §1; loginSchema/registerSchema/forgotPasswordSchema/resetPasswordSchema en §7b; ROUTES actualizado con grupo `auth` | —     |
| 2026-04-16 | F4.2: agregado useAcceptOrderMutation en §3 (feature-local — orders); optimistic update pattern     | —     |
| 2026-04-16 | F4.4: QueryProvider actualizado — retry inteligente (no 4xx), backoff exp., networkMode offlineFirst; exports auxiliares documentados | —     |
| 2026-04-16 | F4.3: agregado parseResponse + ParseError en sección 2b. Query                 | —     |
| 2026-04-16 | F4.5: agregado Toaster en §1; extractErrorMessage en §5; QUERY/MUTATION_ERROR_MESSAGE en §8; QueryProvider actualizado con toast en QueryCache.onError y mutations.onError | —     |
| 2026-04-16 | Auth refactor: LiveMiniMap promovido de `features/landing/` a `shared/components/LiveMiniMap/`; AuthCard reescrito como layout split-screen (form izq + mapa+foto der) | —     |
| 2026-04-17 | F5.2: agregado `realtimeService` en §4; `REALTIME_CHANNELS`, `RealtimeService` interface, factory `createMockRealtimeService` | —     |
| 2026-04-17 | F7.1: agregada sección 14. Test utilities — `renderWithProviders`, `createTestQueryClient`, barrel con RTL + userEvent | —     |
| 2026-04-17 | F9.1: tokens actualizado con grupos FONT_SIZE, HEIGHTS, WIDTHS, MAX_WIDTHS, MIN_WIDTHS, LINE_HEIGHTS, LETTER_SPACINGS, BLUR_TOKENS, SHADOWS extendido | —     |
| 2026-04-17 | F9.2: agregado `Text` (tipografía sistematizada) en §2 — 7 variantes polimórficas, migración de Hero/HowItWorks/Features/StoreCard | —     |
| 2026-04-17 | F9.2 CR: promovido `SectionHeader` a §2 (era export cruzado entre features); `heading-sm` documentado como case-neutral; default genérico de `Text<T>` corregido a `"span"`; `caption` añade `leading-snug` | —     |
| 2026-04-17 | F9.3: agregado Icon component en §2 — lazy-loaded lucide wrapper con token system (ICON_SIZE, ICON_COLOR) | —     |
| 2026-04-19 | F12.1: storeSchema extendido con `description?` y `hours?`; queryKeys.products añadido; productsService creado; StoreDetailSheet (dumb+container) documentado en §13; useStoreByIdQuery + useStoreProductsQuery en §3 | —     |
| 2026-04-19 | F12.5: `ordersService.findByUser` + seed data en orders.mock; `useOrdersQuery` hook; `OrderCard`/`OrderHistoryScreen` en features/orders | —     |
| 2026-04-19 | F12.7: feature `profile` completa — `useLocationPermission`, `useNotificationPrefs`, `ProfilePage`, `LocationPermission`, `NotificationPrefs`, constantes `LOCATION_PERMISSION_STATUS`, `NOTIFICATION_PERMISSION`, `NOTIFICATION_PREF_KEYS`, `NOTIFICATION_PREFS_STORAGE_KEY` (todos feature-local, no promovidos a shared) | —     |
| 2026-04-19 | F13.2: `useLocationPublishing` hook en §13 (store-shell); storeSchema con `ownerId`; `storesService.findByOwnerId`/`updateLocation` implementados; `storeRepository.findByOwnerId` documentado en §11; geo constants "Usado en" actualizado | —     |
| 2026-04-19 | F13.3: agregada sección 13 catalog — CatalogService interface, catalogService mock, 4 hooks RQ (useCatalogQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation), 3 componentes (ProductCard, CatalogList+container, ProductForm+2 containers), createProductSchema/editProductSchema; ROUTES.store extendido con catalogNew y catalogEdit | —     |
| 2026-04-19 | F13.6: `queryKeys.stores.profile` en §2b; `useStoreProfileQuery`/`useUpdateStoreProfileMutation` en §3; `storeProfileSchema`/`updateStoreProfileSchema` en §7b; store-profile feature en §13 | —     |
| 2026-04-19 | F5.3: `useRealtimeInvalidation` en §2b.Query; F12.2: `useCartStore` en §10; F12.3: `useSendOrderMutation` en §3; `OrdersService.send`/`getById` en §4; F12.4: `useOrderQuery` en §3; `OrderTracking`/`OrderTrackingContainer` en §13 | —     |
| 2026-04-20 | F6.4: `InstallPrompt` (dumb+container) en §2 — detección iOS/Android, pasos iOS, native prompt Android, persist dismiss en localStorage | —     |
