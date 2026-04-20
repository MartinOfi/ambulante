# REGISTRY-detail — Infraestructura

> Contiene: utils puros, design tokens, configuración de entorno y stores Zustand.

---

## §5 — Utils puros

Viven en `shared/utils/`. Funciones puras sin efectos secundarios.

| Nombre | Ruta | Firma / Descripción |
|---|---|---|
| `cn` | `shared/utils/cn.ts` | `(...classes: ClassValue[]) => string` — combina clases Tailwind con `clsx` + `tailwind-merge`; usar para condicionales de clase |
| `createLogger` | `shared/utils/logger.ts` | `(namespace: string) => Logger` — crea un logger con prefijo; ver también `logger` (instancia global) |
| `logger` | `shared/utils/logger.ts` | Instancia global de logger. API: `logger.debug(msg, ctx?)`, `logger.info`, `logger.warn`, `logger.error`, `logger.registerErrorHook(hook)`. Dev: imprime a consola. Prod: silencioso salvo `error`. Tipos: `Logger`, `LogContext`, `ErrorHook` |
| `serverLogger` | `shared/utils/server-logger.ts` | Singleton server-only logger (pino). API idéntica a `Logger`: `debug`, `info`, `warn`, `error`, `registerErrorHook`. JSON en prod, pretty en dev. **No importar en client components.** |
| `createRequestLogger` | `shared/utils/server-logger.ts` | `(requestId: string) => Logger` — crea un child logger pino con `requestId` binding. Usar en Route Handlers y Server Actions para correlacionar logs por request. |
| `generateRequestId` | `shared/utils/server-logger.ts` | `() => string` — genera un UUID v4 via `crypto.randomUUID()`. Usar al inicio de cada Route Handler: `const reqId = generateRequestId()`. |
| `extractErrorMessage` | `shared/utils/errorMessage.ts` | `(error: unknown, context?: "query" \| "mutation") => string \| null` — extrae mensaje legible en español. Retorna `null` para errores 4xx (manejados en-feature). |
| `formatDistance` | `shared/utils/format.ts` | `(meters: number) => string` — ej. `"1.2 km"` o `"300 m"` |
| `formatPrice` | `shared/utils/format.ts` | `(amount: number, currency?: string) => string` — formatea a moneda `es-AR` (default ARS) |
| `getRequiredRole` | `shared/utils/route-access.ts` | `(path: string) => UserRole \| null` — mapea pathname al rol requerido; `null` para rutas públicas. Mapeo: `/map*→client`, `/store*→store`, `/admin*→admin` |
| `parseSessionCookie` | `shared/utils/session-cookie.ts` | `(cookieValue: string) => Session \| null` — retorna `null` si vacío, base64 inválido, JSON inválido, expirado, o no satisface `sessionSchema` |
| `serializeSessionCookie` | `shared/utils/session-cookie.ts` | `(session: Session) => string` — serializa la sesión a base64 |
| `writeSessionCookie` | `shared/utils/session-cookie.ts` | `(session: Session) => void` — escribe en `document.cookie` (MOCK PHASE ONLY, sin `httpOnly`) |
| `clearSessionCookie` | `shared/utils/session-cookie.ts` | `() => void` — elimina la cookie de sesión |
| `SESSION_COOKIE_OPTIONS` | `shared/utils/session-cookie.ts` | Flags de seguridad de la cookie |

---

## §6 — Design tokens y estilos globales

Los tokens de diseño tienen dos capas:
- `app/globals.css` — variables CSS (colores, radios, sombras)
- `tailwind.config.ts` — extensiones de tema (mapeo de CSS vars a clases Tailwind)
- `shared/styles/tokens.ts` — single source of truth tipada (importada por `tailwind.config.ts` via ruta relativa)

> Antes de escribir cualquier componente UI, leer estas fuentes para identificar la paleta disponible. **No hardcodear colores, tipografía ni espaciado.**

### tokens — `shared/styles/tokens.ts`

Single source of truth de design tokens tipados. Usado por `tailwind.config.ts` (via import relativo — path aliases no aplican en ese contexto Node.js).

- **Exports:** `COLORS`, `RADIUS`, `SHADOWS`, `MOTION`, `TYPOGRAPHY`, `FONT_SIZE`, `HEIGHTS`, `WIDTHS`, `MAX_WIDTHS`, `MIN_WIDTHS`, `LINE_HEIGHTS`, `LETTER_SPACINGS`, `BLUR_TOKENS`
- **Grupos:**
  - `FONT_SIZE` — escala tipográfica: `3xs` (9px), `2xs` (10px), `xs-tight` (11px), `xs-loose` (13px), `display-hero` (clamp 2rem→3.5rem), `display-auth` (40px)
  - `HEIGHTS` — alturas semánticas: `screen-dvh` (100dvh), `sheet-collapsed`, `sheet-half`, `sheet-full`, `orb-lg`
  - `WIDTHS` — anchos semánticos: `nav-description`, `nav-sm`, `nav-md`, `orb-lg`
  - `MAX_WIDTHS` — anchos máximos: `content-sm` (260px), `content-md` (320px)
  - `MIN_WIDTHS` — anchos mínimos: `chip` (48px)
  - `LINE_HEIGHTS` — interlineado: `display` (0.95), `tight-xl` (0.9)
  - `LETTER_SPACINGS` — tracking: `tag` (0.14em), `eyebrow` (0.2em), `display` (-0.02em)
  - `BLUR_TOKENS` — radios de blur: `orb` (100px), `ambient` (120px)
  - `SHADOWS` — sombras: `pin`, `card-brutal`, `card-brutal-hover`, `sheet`
  - `COLORS.raw.light` / `COLORS.raw.dark` — valores crudos HSL para uso runtime
  - `COLORS.cssVarRefs` — referencias `hsl(var(--token))` para el config de Tailwind

### contrast — `shared/styles/contrast.ts`

Utilidades WCAG para calcular luminancia relativa y ratio de contraste desde valores HSL.

- **Exports:** `WCAG_THRESHOLDS` (`{ normalText: 4.5, largeText: 3.0 }`), `parseHsl`, `hslToLuminance`, `contrastRatio`
- **Tipo exportado:** `HslColor — { h: number; s: number; l: number }`
- **Nota:** `parseHsl` acepta el formato `"H S% L%"` que usan los tokens en `COLORS.raw`. Usado en `contrast.test.ts` para auditorías WCAG AA.

### motion — `shared/styles/motion.ts`

Primitivas de animación derivadas de `MOTION` en `tokens.ts`.

- **Exports:**
  - `FM_DURATIONS` — `{ fast, base, slow }` en segundos (para framer-motion)
  - `FM_EASINGS` — `{ easeOut, easeInOut, linear }` como `[number, number, number, number]`
  - `TRANSITIONS` — `{ fast, base, slow, spring }` listos para pasar a `transition=` de motion components
  - `FADE_IN_VARIANTS`, `SLIDE_UP_VARIANTS`, `SLIDE_DOWN_VARIANTS` — objetos `{ initial, animate, exit }` para `variants=`
  - `TW_TRANSITIONS` — `{ fast, base, slow }` como strings de clases Tailwind (`"transition duration-200 ease-out"`)
- **Tipos internos:** `MotionTransition`, `MotionVariants` — compatibles con `motion/react`

---

## §8b — Feature Flags

Sistema de feature flags basado en Vercel Edge Config con fallback a defaults en desarrollo.

### Constantes — `shared/constants/flags.ts`

| Nombre | Tipo | Descripción |
|---|---|---|
| `FLAG_KEYS` | `as const object` | Claves de todos los flags: `ENABLE_ORDERS`, `ENABLE_REALTIME`, `ENABLE_PUSH_NOTIFICATIONS`, `ENABLE_STORE_DASHBOARD` |
| `FlagKey` | `type` | Union de los valores de `FLAG_KEYS` — e.g. `"enable_orders"` |
| `FLAG_DEFAULTS` | `Readonly<Record<FlagKey, boolean>>` | Valores por defecto usados en dev/test y como fallback si Edge Config falla |

### Service (server-side) — `shared/services/flags.ts`

- **Import:** `import { flagsService } from "@/shared/services/flags"`
- **Uso:** solo en Server Components, Route Handlers o Server Actions
- **Env var:** `EDGE_CONFIG` (URL de Vercel Edge Config); si no está seteada, devuelve defaults sin llamar a la API
- **API:**
  - `flagsService.getFlag(key: FlagKey): Promise<boolean>` — lee un flag individual
  - `flagsService.getAllFlags(): Promise<Record<FlagKey, boolean>>` — lee todos los flags de una vez (más eficiente para hidratar el provider)
- **Fallback:** si `EDGE_CONFIG` no está seteado o Edge Config lanza, loguea el error y devuelve el valor de `FLAG_DEFAULTS`

### Provider (client-side) — `shared/providers/FlagsProvider.tsx`

- **Import:** `import { FlagsProvider } from "@/shared/providers/FlagsProvider"`
- `"use client"` — envoltura de contexto React para client components
- **Props:** `flags: Record<FlagKey, boolean>` (obtenido del server via `getAllFlags()`) + `children`
- **Uso típico:** en un layout server component, llamar `getAllFlags()` y pasar el resultado al `<FlagsProvider flags={...}>`

### Hook (client-side) — `shared/hooks/useFlag.ts`

- **Import:** `import { useFlag } from "@/shared/hooks/useFlag"`
- `"use client"`
- **Firma:** `useFlag(key: FlagKey): boolean`
- **Requiere:** estar dentro de `<FlagsProvider>`. Lanza si se usa fuera.
- **Fallback:** si el key no está en el contexto, devuelve `false`

---

## §11 — Hooks de accesibilidad

### useFocusTrap — `shared/hooks/useFocusTrap.ts`

- **Import:** `import { useFocusTrap } from "@/shared/hooks/useFocusTrap"`
- **Firma:** `useFocusTrap(options: UseFocusTrapOptions): void`
- **Tipo de options:**
  ```ts
  interface UseFocusTrapOptions {
    readonly ref: { current: HTMLElement | null };
    readonly active: boolean;
    readonly onEscape?: () => void;
  }
  ```
- **Comportamiento:**
  - Cuando `active=true`: foca el primer elemento focusable dentro de `ref.current`
  - Atrapa Tab / Shift+Tab dentro del contenedor (wrapping circular)
  - Llama `onEscape` cuando el usuario presiona Escape (si `active=true`)
  - Limpia los event listeners en unmount / cuando `active` cambia a `false`
- **Uso típico:** dialogs, bottom sheets modales, cualquier región que requiera focus trap WCAG
- **Test:** `shared/hooks/useFocusTrap.test.ts` — 8 casos

---

## §9 — Configuración de entorno

| Nombre | Ruta | Descripción |
|---|---|---|
| `env` | `shared/config/env.runtime.ts` | Objeto con todas las variables de entorno validadas y tipadas (resultado congelado de parsear `process.env` al import) |
| `parseEnv` | `shared/config/env.schema.ts` | `(raw: Record<string, string \| undefined>) => Env` — valida con Zod; lanza si faltan vars requeridas |
| `Env` | `shared/config/env.schema.ts` | Tipo inferido del schema |

**Schema actual (todos los campos):**

| Variable | Tipo Zod | Requerida |
|---|---|---|
| `NODE_ENV` | `enum("development","test","production")` default `"development"` | no |
| `NEXT_PUBLIC_APP_URL` | `string().url()` | sí |
| `NEXT_PUBLIC_SENTRY_DSN` | `string().url().optional()` | no |
| `SENTRY_DSN` | `string().url().optional()` | no |
| `SENTRY_AUTH_TOKEN` | `string().optional()` | no |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `string().optional()` | no |
| `NEXT_PUBLIC_MAP_STYLE_URL` | `string().url().optional()` | no — URL del estilo MapLibre; default en `.env.example`: `https://demotiles.maplibre.org/style.json` |

**Consumers TS:** importar `env` desde `@/shared/config/env.runtime`. `next.config.ts` importa el side-effect `shared/config/env.runtime` para validar al build.

---

## §10 — Stores Zustand

Para estado global del cliente. Usar solo cuando React state local no alcance.

> **Convención de slices:** separar `State` (readonly) de `Actions` en interfaces distintas. Exportar el hook completo como `use<Name>Store`.
> **Persistencia:** usar middleware `persist` con `partialize` para serializar solo el state, no las acciones.
> **Selección granular:** `const value = useXStore((s) => s.field)` — nunca desestructurar el store entero para evitar re-renders innecesarios.

### useCartStore — `shared/stores/cart.ts`

- **Descripción:** Estado global del carrito. Persiste en localStorage. Soporta un único `activeStoreId` — agregar producto de otra tienda limpia el carrito actual (invariante de aislamiento de tienda).
- **Estado:** `activeStoreId: string | null`, `items: readonly CartItem[]`
- **Acciones:** `addItem(product, storeId)`, `removeItem(productId)`, `clearCart()`, `totalItems(): number`
- **Persistencia:** key `"ambulante-cart"` en localStorage (solo state, sin acciones)
- **Tipo exportado:** `CartItem = OrderItem & { storeId: string }`

### useUIStore — `shared/stores/ui.ts`

- **Descripción:** Preferencias de UI persistidas en localStorage. Incluye `theme` y `isSidebarOpen`.
- **Estado:** `theme: Theme`, `isSidebarOpen: boolean`
- **Acciones:** `setTheme(theme)`, `toggleSidebar()`, `setSidebarOpen(isOpen)`
- **Persistencia:** key `"ambulante-ui-preferences"` en localStorage (solo state, sin acciones)
- **Tipo re-exportado:** `Theme = "light" | "dark" | "system"`
