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

---

## 2b. Query (`shared/query/`)

### queryKeys

- **Ruta:** `shared/query/keys.ts`
- **Descripción:** Registro centralizado de query key factories para React Query v5. Organizado por dominio con jerarquía para invalidación parcial.
- **API:** `queryKeys.stores.all()`, `queryKeys.stores.nearby(coords, radiusMeters)`, `queryKeys.stores.byId(id)`, `queryKeys.orders.all()`, `queryKeys.orders.byUser(userId)`, `queryKeys.orders.byId(id)`
- **Usado en:** hooks de data en `features/*/hooks/`.

---

## 2c. Providers (`shared/providers/`)

### QueryProvider

- **Ruta:** `shared/providers/QueryProvider.tsx`
- **Descripción:** Envuelve la app con `QueryClientProvider` de React Query v5. Crea un `QueryClient` estable por instancia con defaults de staleTime (30s), gcTime (5min), retry (1) y `refetchOnWindowFocus: false`. Monta `ReactQueryDevtools` solo en `NODE_ENV === "development"`.
- **API:** `<QueryProvider>{children}</QueryProvider>`
- **Usado en:** `app/layout.tsx`.

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
- **Descripción:** Cliente de tiendas detrás de una interfaz `StoresService`. Implementación actual: `MockStoresService`. Swap a Supabase sin tocar consumers.
- **API:** `findNearby({ coords, radiusMeters })`, `findById(id)`
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

---

## 6. Styles (`shared/styles/`)

_(vacío — globals viven en `app/globals.css`)_

---

## 7. Types (`shared/types/`)

> Tipos compartidos del dominio. Los tipos específicos de una feature van en su carpeta, no acá.

### Store, StoreKind, StoreStatus, Coordinates

- **Ruta:** `shared/types/store.ts`
- **Descripción:** Modelo de tienda ambulante y tipos asociados. `Coordinates` es genérico para cualquier punto geo.
- **Usado en:** `features/map/*`, `shared/services/stores`, `shared/hooks/useGeolocation`.

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

## Changelog del registry

| Fecha      | Cambio                                                              | Autor |
| ---------- | ------------------------------------------------------------------- | ----- |
| 2026-04-15 | Creación del registry                                               | —     |
| 2026-04-15 | Migración a estructura `features/` + `shared/` (Opción A auditoría) | —     |
| 2026-04-15 | F0.2: agregada sección 9. Config con `env`                          | —     |
| 2026-04-15 | F0.8: nota sobre `env.*.mjs` actualizada — Next 15 permite unificar | —     |
| 2026-04-16 | F1.1: agregado QueryProvider en sección 2c                          | —     |
| 2026-04-16 | F1.2: agregado queryKeys en sección 2b                              | —     |
