# REGISTRY-detail — UI

> Contiene: componentes UI primitivos (shadcn), compuestos, layout, tipografía y providers.

---

## §1 — Primitivas shadcn/ui

Todas viven en `shared/components/ui/`. Se añaden con `pnpm dlx shadcn@latest add <component>`. **No modificar la API pública sin razón.**

### Badge
- **Ruta:** `shared/components/ui/badge.tsx`
- **API:** `<Badge variant? />` — variantes: `default`, `secondary`, `destructive`, `outline`

### Button
- **Ruta:** `shared/components/ui/button.tsx`
- **API:** `<Button variant? size? asChild? />` — variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

### Card
- **Ruta:** `shared/components/ui/card.tsx`
- **Sub-exports:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

### Form
- **Ruta:** `shared/components/ui/form.tsx`
- **Descripción:** Sistema completo shadcn: `Form` (alias de `FormProvider`), `FormField` (wrapper de `Controller`), `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`. Integra `react-hook-form` + Zod via `zodResolver`. `FormLabel` y `FormControl` leen el estado de error automáticamente vía contexto.
- **API:** `<Form><FormField control name render={({ field }) => <FormItem>...} /></Form>`

### Input
- **Ruta:** `shared/components/ui/input.tsx`
- **Descripción:** Campo de texto con `React.forwardRef`, diseño con tokens (`bg-surface`, `border-border`, `focus-visible:ring-brand`). Acepta todos los atributos nativos de `<input>`.

### Label
- **Ruta:** `shared/components/ui/label.tsx`
- **Descripción:** Label accesible basado en `@radix-ui/react-label` con `cva`. Aplica `text-destructive` si su campo asociado tiene error (integrado con Form).

### NavigationMenu
- **Ruta:** `shared/components/ui/navigation-menu.tsx`
- **Descripción:** Menú de navegación radix-ui con sublistas y viewport.

### Popover
- **Ruta:** `shared/components/ui/popover.tsx`
- **Sub-exports:** `Popover`, `PopoverTrigger`, `PopoverContent`

### Toaster
- **Ruta:** `shared/components/ui/toaster.tsx`
- **Descripción:** Wrapper `"use client"` sobre `sonner`'s `<Toaster />`. Configurado con `position="bottom-center"`, `richColors`, `closeButton`. Montado en `app/layout.tsx` dentro de `<ThemeProvider>`.
- **API:** `<Toaster />` — sin props. Para disparar toasts: `import { toast } from "sonner"`.

### RadialOrbitalTimeline
- **Ruta:** `shared/components/ui/radial-orbital-timeline.tsx`
- **API:** `<RadialOrbitalTimeline timelineData={TimelineItem[]} />`
- **⚠️ Excepción §6.5:** 323 líneas — primitiva externa de shadcn/magicui; tratar como dependencia de terceros.

---

## §2 — Componentes compuestos reutilizables

### Layout primitives — `shared/components/layout/`

- **Ruta barrel:** `shared/components/layout/index.ts`
- **Tipo polimórfico compartido:** `shared/components/layout/polymorphic.types.ts` → `PolymorphicProps<T, Extra>` (prop `as` poly)
- **API:** `import { Stack, Row, Container, Screen, Spacer, Divider } from '@/shared/components/layout'`

| Nombre | Descripción | Props clave |
|---|---|---|
| `Stack` | flex-col | `gap`, `align`, `justify`, `as` |
| `Row` | flex-row | `gap`, `align`, `justify`, `wrap`, `as` |
| `Container` | max-width centrado | `size` (sm/md/lg/xl/full), `padded`, `as` |
| `Screen` | wrapper full-viewport `min-h-screen overflow-y-auto` | `className` |
| `Spacer` | spacer `aria-hidden` | `size` (1–16), `axis` (vertical/horizontal) |
| `Divider` | `<hr>` con `border-border` | `orientation` (horizontal/vertical) |

### Tipografía — `shared/components/typography/`

#### Text
- **Ruta:** `shared/components/typography/Text.tsx`
- **Descripción:** Componente polimórfico de tipografía con variantes semánticas. Reemplaza inline Tailwind en h1/h2/h3/p/span.
- **API:** `<Text variant="..." as?: ElementType className? {...htmlAttrs} />`
  - `as` acepta cualquier tag HTML o componente React. Default: `"span"`.
- **Elementos por defecto:** `display-xl→h1`, `display-lg→h2`, `heading-sm→h3`, `body/body-sm→p`, `overline/caption→span`
- **Nota `heading-sm`:** es neutral en casing — no bake `uppercase`. Callers añaden `className="uppercase"` cuando lo necesitan.
- **Nota `display-xl`:** incluye breakpoints responsivos baked-in (`sm:text-6xl lg:text-7xl xl:text-8xl`). Se pueden sobreescribir via `className` + `tailwind-merge`.
- **Tipo exportado:** `TextVariant`

#### SectionHeader
- **Ruta:** `shared/components/typography/SectionHeader.tsx`
- **API:** `<SectionHeader eyebrow="..." title="..." />`
- **Descripción:** Bloque compuesto de eyebrow (`overline`) + título (`display-lg`). Promovido de `features/landing/HowItWorks`.

### Icon — `shared/components/Icon/`

- **Archivos:** `Icon.tsx`, `Icon.types.ts`, `index.ts`
- **Descripción:** Wrapper lazy-loaded sobre `lucide-react`. Carga cada icono bajo demanda con `React.lazy` + módulo-level cache (`Map<IconName, LazyExoticComponent>`). Gestiona su propio `<Suspense>` interno con fallback `<span>` del mismo tamaño.
- **API:** `<Icon name size? color? className? aria-label? aria-hidden? />`
  - `name` — `IconName` (union de ~1450 nombres de lucide, con autocomplete y typo-detection)
  - `size` — `"xs" | "sm" | "md" | "lg" | "xl"` (12/16/20/24/32px). Default: `"md"`.
  - `color` — `"inherit" | "brand" | "muted" | "foreground" | "success" | "destructive"`. Default: `"inherit"` (`currentColor`).
- **Constantes exportadas:** `ICON_SIZE`, `ICON_COLOR`, `ICON_STROKE_WIDTH` (1.5)
- **Tipos exportados:** `IconName`, `IconSize`, `IconColor`, `IconProps`
- **Nota:** requiere `"use client"` (React.lazy). El boundary se toma del primer Client Component ancestro.

### ServiceWorkerUpdateBanner — `shared/components/ServiceWorkerUpdateBanner/`

- **Archivos:** `ServiceWorkerUpdateBanner.tsx` (dumb), `ServiceWorkerUpdateBanner.container.tsx` (smart, `"use client"`), `ServiceWorkerUpdateBanner.types.ts`, `ServiceWorkerUpdateBanner.test.tsx`
- **Descripción:** Banner de notificación de nueva versión disponible. Aparece cuando hay un Service Worker en waiting. Botones "Actualizar" y "Después". Al actualizar, envía `SKIP_WAITING` al SW y espera el `controllerchange` para recargar la página.
- **API dumb:** `<ServiceWorkerUpdateBanner onApply onDismiss />` — requiere `role="alert"` + `aria-live="polite"` (ya incluido)
- **API smart:** `<ServiceWorkerUpdateBannerContainer />` — sin props. Conecta `useServiceWorkerUpdate` + `useServiceWorkerControllerReload`. Renderiza `null` si `status !== "available"`.
- **Tipos exportados:** `ServiceWorkerUpdateBannerProps`
- **i18n:** claves bajo namespace `"ServiceWorker"` en `messages/es-AR.json`: `updateAvailable`, `later`, `update`
- **Montado en:** `app/layout.tsx` dentro de `<ThemeProvider>`

### InstallPrompt — `shared/components/InstallPrompt/`

- **Archivos:** `InstallPrompt.tsx` (dumb), `InstallPrompt.container.tsx` (smart, `"use client"`), `InstallPrompt.types.ts`, `InstallPrompt.test.tsx`
- **Descripción:** Prompt de instalación PWA con detección de plataforma. En iOS muestra pasos para instalar desde Safari (requerido para push). En Android con `BeforeInstallPromptEvent`, ofrece instalación nativa directa. Persiste dismiss en localStorage. Renderiza `null` si ya instalado o plataforma desconocida.
- **API dumb:** `<InstallPrompt platform isInstalled canTriggerNativePrompt onTriggerNativePrompt onDismiss />`
- **API smart:** `<InstallPromptContainer />` — sin props. Detecta plataforma, escucha `beforeinstallprompt`, persiste dismissed en localStorage key `"ambulante-install-prompt-dismissed"`.
- **Constantes exportadas:** `INSTALL_PLATFORM` — `{ ios, android, unknown }` as const
- **Tipos exportados:** `InstallPlatform`, `InstallPromptProps`, `BeforeInstallPromptEvent`
- **Gotcha:** `BeforeInstallPromptEvent` es API no estándar de Chromium — tipada localmente, no augmenta `Window` global. `navigator.standalone` (iOS Safari) requiere `@ts-expect-error`.

### LiveMiniMap — `shared/components/LiveMiniMap/`

- **Archivos:** `LiveMiniMap.tsx`, `MapCanvas.tsx`, `UserMarker.tsx`, `VendorMarker.tsx`, `vendors.ts`
- **Descripción:** Mapa decorativo en tiempo real con marcadores de tiendas ambulantes, radar de usuario, street grid SVG y badges. Server Component sin props. Promovido de `features/landing/` para uso en auth pages.
- **API:** `<LiveMiniMap />` — sin props.
- **Sub-tipos:** `MapVendor`, `VendorState`, `LabelSide` exportados desde `vendors.ts`.
- **Usado en:** `features/landing/components/Hero`, `features/auth/components/AuthCard`.

### Theme — `shared/components/theme/`

| Nombre | Ruta | Descripción |
|---|---|---|
| `ThemeProvider` | `shared/components/theme/ThemeProvider.tsx` | Provider de `next-themes`; envuelve la app en `app/layout.tsx` |
| `ThemeToggle` | `shared/components/theme/ThemeToggle.tsx` | Botón que alterna entre light/dark |

---

## §2c — Providers

### QueryProvider
- **Ruta:** `shared/providers/QueryProvider.tsx`
- **Descripción:** Envuelve la app con `QueryClientProvider`. Crea `QueryClient` estable con: `staleTime` 30s, `gcTime` 5min, retry inteligente (sin retry en 4xx, máx 3 intentos), `retryDelay` exponencial acotado (1s→30s), `networkMode: 'offlineFirst'`, `refetchOnWindowFocus: false`. Monta `ReactQueryDevtools` solo en `NODE_ENV === "development"`.
- **API:** `<QueryProvider>{children}</QueryProvider>`
- **Exports auxiliares:** `isClientError(error)`, `computeRetryDelay(attemptIndex)`, `shouldRetry(failureCount, error)` — exportadas para testabilidad.

### NuqsProvider
- **Ruta:** `shared/providers/NuqsProvider.tsx`
- **Descripción:** Adaptador de `nuqs` para Next.js App Router. Necesario para que cualquier `useQueryState` / `useQueryStates` funcione.
- **API:** `<NuqsProvider>{children}</NuqsProvider>`
