# CLAUDE.md — Ambulante

Guía para Claude Code y cualquier agente/desarrollador que trabaje en este repo.
**PRD completo:** [`docs/PRD.md`](./docs/PRD.md) — fuente de verdad del producto.

---

## 1. Resumen del producto

**Ambulante** es una PWA que conecta clientes con tiendas ambulantes (food trucks, puestos callejeros) vía geolocalización en tiempo real.
**No es un marketplace transaccional**: no procesa pagos, no gestiona stock, no tiene ratings ni chat. Solo coordina la intención de compra para facilitar el encuentro físico.

**Estado actual del repo:** solo frontend. No hay backend todavía — los datos se mockean mientras tanto.

---

## 2. Stack técnico

### Core
- **Framework:** Next.js 15 (App Router) — *actualmente en 14.2.5, migrar cuando haya ventana*
- **Lenguaje:** TypeScript **strict mode** (no negociable)
- **Runtime:** Node 20+
- **Package manager:** `pnpm` (preferido; si el repo hoy tiene `package-lock.json`, migrar a `pnpm-lock.yaml`)

### UI
- **Estilos:** Tailwind CSS v4
- **Componentes base:** `shadcn/ui` (copiados al repo en `shared/components/ui/`)
- **Primitivas:** Radix UI (via shadcn)
- **Iconos:** `lucide-react`
- **Animaciones:** `motion` (ex Framer Motion)

### Formularios y validación
- **Formularios:** `react-hook-form`
- **Validación / schemas:** `zod` — siempre en los boundaries (inputs de usuario, respuestas externas, params de URL).

### Estado
- **Server state / data fetching:** `@tanstack/react-query` v5
- **Client state global:** `zustand` (solo cuando React state local no alcance)
- **URL state:** `nuqs` para filtros sincronizados con query params

### Mapas (crítico)
- **Librería:** `react-map-gl` + **MapLibre GL JS** (open source, sin API key)

### PWA
- **Service worker / PWA:** `serwist` (NO usar `next-pwa`, está abandonado)
- **Push:** Web Push API nativa

### Testing
- **Unit / component:** `vitest` + `@testing-library/react`
- **E2E:** `playwright`
- **Cobertura mínima:** 80%

### Tooling
- `eslint` + `prettier` + `husky` + `lint-staged`
- Conventional commits (`commitlint`)

### Deploy
- **Vercel** (creadores de Next.js)

### Backend futuro (cuando llegue)
- **Supabase** (Postgres + Auth + Realtime + Storage + PostGIS) es el candidato. No lo implementemos todavía; los servicios de datos se mockean en `shared/services/` con interfaces claras para que el swap sea trivial.

---

## 3. Comandos

```bash
pnpm dev         # dev server
pnpm build       # build de producción
pnpm start       # servir build
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
pnpm test:e2e    # playwright
```

---

## 4. Arquitectura de carpetas

**Filosofía:** *todo lo reutilizable vive en `shared/`. Las features son islas independientes.*

```
ambulante/
├── app/                      # Next.js App Router (solo rutas, layouts, páginas)
│   ├── (client)/             # Rutas del rol Cliente
│   ├── (store)/              # Rutas del rol Tienda
│   ├── (admin)/              # Rutas del rol Administrador
│   └── layout.tsx
│
├── features/                 # Una carpeta por feature, totalmente aislada
│   ├── <feature-name>/
│   │   ├── components/       # Componentes SOLO de esta feature
│   │   │   ├── <Component>/
│   │   │   │   ├── <Component>.tsx            # dumb (presentational)
│   │   │   │   ├── <Component>.container.tsx  # smart (lógica / data)
│   │   │   │   ├── <Component>.types.ts
│   │   │   │   ├── <Component>.test.tsx
│   │   │   │   └── index.ts
│   │   ├── hooks/            # Hooks específicos de la feature
│   │   ├── services/         # Llamadas a API / mocks
│   │   ├── types/            # Tipos específicos
│   │   ├── utils/            # Helpers específicos
│   │   └── index.ts          # Barrel de exports públicos de la feature
│   │
│   ├── map/                  # Ej: feature del mapa de tiendas
│   ├── order-flow/           # Ej: feature del flujo de pedido
│   └── store-dashboard/      # Ej: dashboard de la tienda
│
├── shared/                   # Todo lo REUTILIZABLE (usado en 2+ lugares)
│   ├── components/
│   │   ├── ui/               # Primitivas shadcn (Button, Card, Input…)
│   │   └── <Custom>/         # Componentes compuestos reutilizables
│   ├── hooks/                # ej: useGeolocation, useDebounce
│   ├── services/             # Clientes de datos (hoy mocks, mañana Supabase)
│   ├── utils/                # Funciones puras genéricas
│   ├── styles/               # Tokens, temas, globals compartidos
│   ├── types/                # Tipos globales del dominio
│   ├── constants/            # Constantes de dominio (estados, timeouts, enums)
│   └── REGISTRY.md           # 🔑 Índice vivo de todo lo disponible en shared/
│
├── docs/
│   └── PRD.md                # PRD completo del producto
│
└── public/
```

### Regla de promoción a `shared/`
- Si algo se usa **en una sola feature** → vive dentro de esa feature.
- Si algo se usa **en 2 o más lugares** → se mueve a `shared/` y se documenta en `shared/REGISTRY.md`.
- Borrar una feature **nunca** debe romper otras — por eso nada cruzado entre features. Si dos features necesitan lo mismo, va a `shared/`.

---

## 5. El archivo `shared/REGISTRY.md` (fuente de verdad de lo reutilizable)

**Antes de crear cualquier componente, hook, util, service o constante nuevo, el agente DEBE leer `shared/REGISTRY.md` para verificar si ya existe algo reutilizable.**

- Si existe algo que sirve → se reutiliza.
- Si existe algo casi-casi → se extiende o se generaliza lo existente, no se duplica.
- Si no existe y se crea → **se agrega al registry en el mismo commit**.

El registry lista: nombre, ruta, descripción breve en una línea, y props/args clave.

> **TODO:** crear un skill local (`shared-registry-updater`) que, mediante hook `PostToolUse` sobre `Write`/`Edit` dentro de `shared/`, recuerde al agente actualizar el `REGISTRY.md`. Mientras tanto, es responsabilidad del agente hacerlo manualmente.

---

## 6. Reglas de código (invariantes — NO negociables)

### 6.1 TypeScript
1. **Prohibido `any`**. Usar `unknown` + narrowing, o definir el tipo correcto. Si es absolutamente inevitable, justificarlo con `// @ts-expect-error <razón>`.
2. **Strict mode siempre activo.** No bajar flags de `tsconfig`.
3. **Nunca `as` casts** sin justificación. Preferir type guards.

### 6.2 Nombres
1. **Prohibido magic strings.** Todo string literal con significado va a `shared/constants/` o `features/<x>/constants.ts` como `const` tipada o `enum as const`.
   - ❌ `if (order.status === "ACCEPTED")`
   - ✅ `if (order.status === ORDER_STATUS.ACCEPTED)`
2. **Prohibido magic numbers.** Mismo tratamiento (`GEO_REFRESH_INTERVAL_MS`, `ORDER_EXPIRATION_MINUTES`…).
3. **Prohibidas variables de una sola letra** que no sean descriptivas. Excepciones acotadas: índice `i` en un `for` clásico, `e` para `event` en handlers cortos. Nada más.
4. **Nombres en inglés** para código (variables, funciones, tipos, archivos). **UI copy en español.**

### 6.3 Funciones
1. **Funciones puras** siempre que sea posible. Efectos secundarios solo en los bordes (event handlers, effects, services).
2. **Máximo 2 parámetros posicionales.** Si hace falta un tercero, es un **objeto único con su interfaz nombrada**, deconstruido en la firma:
   ```ts
   // ❌
   function createOrder(clientId: string, storeId: string, items: Item[], notes: string) {}

   // ✅
   interface CreateOrderInput {
     clientId: string;
     storeId: string;
     items: Item[];
     notes?: string;
   }
   function createOrder({ clientId, storeId, items, notes }: CreateOrderInput) {}
   ```
3. **Máximo 50 líneas por función.** Si crece, extraer helpers.
4. **Una sola responsabilidad.** Si el nombre tiene "y"/"and", hay que partirla.

### 6.4 Componentes — patrón Container / Presentational (Smart/Dumb)
1. **Dumb (`<Component>.tsx`):** solo recibe props y renderiza. **Sin llamadas a hooks de datos, sin fetching, sin estado global.** Son testables y reutilizables.
2. **Smart (`<Component>.container.tsx`):** conecta datos (React Query, Zustand, services) y pasa props al dumb. Nada de JSX complejo acá.
3. **Prohibidos los componentes gigantes.** Máximo **200 líneas por archivo de componente**. Si crece, partir en subcomponentes.
4. **Un componente por archivo.** Nombre del archivo = nombre del componente.
5. **Server Components por defecto.** Marcar `"use client"` solo cuando haya interactividad, hooks o APIs del browser.

### 6.5 Archivos
1. **Máximo 300 líneas por archivo.** Hard limit 400. Si crece, partir por responsabilidad.
2. **Un archivo = una responsabilidad.** No mezclar tipos, utils y componentes en el mismo archivo.
3. **Imports:** absolutos con alias (`@/shared/...`, `@/features/...`). Nada de `../../../`.

### 6.6 Inmutabilidad
1. **Nunca mutar.** Siempre retornar nuevas copias (`...spread`, `map`, `filter`, `Object.assign({}, ...)`, estructuras persistentes).
2. **`const` por default**, `let` solo si hay reasignación real.
3. **`readonly`** en props e interfaces cuando aplique.

### 6.7 Errores
1. **Nunca tragar errores.** Todo `catch` debe loggear (con contexto) y decidir qué mostrar al usuario.
2. **Mensajes de error en UI:** humanos, en español, sin stack traces.
3. **Validación de inputs** en el boundary con Zod — siempre.

### 6.8 Comentarios
1. **Default: no comentar.** Código bien nombrado se explica solo.
2. **Comentar solo el "por qué"** cuando no sea obvio (workaround de un bug, constraint de negocio no capturado en el tipo).
3. **Nunca** comentar "qué hace" el código.

---

## 7. Invariantes de dominio (del PRD)

Estas reglas son del producto y no pueden cambiar sin actualizar `docs/PRD.md` primero.

### 7.1 Máquina de estados del pedido
```
[ENVIADO] → [RECIBIDO] → [ACEPTADO] → [EN_CAMINO] → [FINALIZADO]
               ↓             ↓
           [RECHAZADO]   [CANCELADO]
           [EXPIRADO]
```
- Solo el **actor autorizado** dispara cada transición:
  - Cliente: `ENVIADO`, `EN_CAMINO`, `CANCELADO` (pre-`ACEPTADO`)
  - Tienda: `ACEPTADO`, `RECHAZADO`, `FINALIZADO`
  - Sistema: `RECIBIDO`, `EXPIRADO`
- Estados terminales son inmutables.
- Toda transición registra timestamp.

### 7.2 Privacidad de ubicación
- La ubicación exacta del cliente **nunca** se expone a la tienda antes de `ACEPTADO`.

### 7.3 Roles aislados
- Una tienda no puede ver ni tocar pedidos de otra tienda.
- Un cliente no puede disparar transiciones que le corresponden a la tienda (y viceversa).

### 7.4 Snapshot de productos
- Al crear un pedido se guarda un snapshot del producto. Si después se edita o elimina el producto del catálogo, el pedido conserva lo que tenía al momento de envío.

### 7.5 Geolocalización
- Tienda reporta ubicación cada 30–60s mientras `disponibilidad = activa`.
- Descartar lecturas con error > 50m.
- Si pasan > 2min sin update, marcar "ubicación desactualizada".

### 7.6 Timeouts
- Pedido sin respuesta de tienda → `EXPIRADO` a los 10 min.
- Pedido `ACEPTADO` sin cierre → auto-cierre a las 2h.

### 7.7 Fuera de alcance MVP
Pagos, stock, ratings, chat. **Si aparece una tarea que los incluye, el agente debe detenerse y preguntar.**

---

## 8. Flujo de trabajo esperado del agente

Antes de escribir código:
1. **Leer `shared/REGISTRY.md`** — ¿ya existe lo que voy a crear?
2. **Verificar alcance** — ¿está en §5 del PRD? ¿respeta §7 (invariantes)?
3. **Decidir ubicación** — ¿es de una sola feature o va a `shared/`?
4. **Diseñar tipos primero** (Zod schema → TS type) antes de implementar.
5. **Escribir el test primero** (TDD) para lógica no trivial.

Al terminar código:
1. Si tocó `shared/` → actualizar `REGISTRY.md`.
2. Correr `pnpm lint` + `pnpm typecheck`.
3. Verificar que el archivo resultante cumpla los límites de §6.5 y §6.4.
4. Commit con conventional commits.

---

## 9. Gotchas

- **iOS Safari + Push notifications:** solo funcionan si el usuario instaló la PWA. Fallback a polling para usuarios no-instalados.
- **Geolocalización en dev:** Chrome DevTools permite mockear coordenadas (Sensors → Location). Usar esto en lugar de hardcodear.
- **Service Worker:** solo corre en build de producción. En dev, usar `pnpm build && pnpm start` para testearlo.
- **Mocks mientras no hay back:** todo lo que va a ser API real vive en `shared/services/` detrás de una interfaz. No importar mocks directamente en componentes.
