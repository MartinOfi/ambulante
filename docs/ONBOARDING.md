# Ambulante — Guía de Onboarding

> **Objetivo:** Un dev nuevo puede levantar el proyecto y hacer su primer PR en menos de un día.
> **Fuente de verdad del producto:** [`docs/PRD.md`](./PRD.md)
> **Arquitectura y tareas:** [`docs/EPIC-ARCHITECTURE.md`](./EPIC-ARCHITECTURE.md)

---

## 1. Prerequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20+ | `node -v` |
| pnpm | 10+ | `pnpm -v` |
| Git | 2.30+ | `git --version` |

> **¿No tenés pnpm?** → `npm install -g pnpm`

---

## 2. Setup inicial (5 minutos)

```bash
# 1. Clonar el repo
git clone <repo-url> ambulante
cd ambulante

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si necesitás sobreescribir algún valor
# Para desarrollo local, los defaults del .env.example funcionan sin cambios.

# 4. Levantar el servidor de desarrollo
pnpm dev
# → http://localhost:3000
```

> **Service Worker / PWA:** el SW solo corre en producción.
> Para testear features PWA: `pnpm build && pnpm start`.

### Variables de entorno

| Variable | Requerida en dev | Descripción |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | URL base de la app |
| `NEXT_PUBLIC_MAP_STYLE_URL` | ✅ | Estilo de MapLibre (default: demotiles, sin API key) |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry (browser); solo para producción/staging |
| `SENTRY_DSN` | ❌ | Sentry (server-side); solo para producción/staging |
| `SENTRY_AUTH_TOKEN` | ❌ | Solo para CI/CD (upload de source maps) |
| `UPSTASH_REDIS_REST_URL` | ❌ | Rate limiting distribuido; en dev se usa limiter en memoria |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | Token de autenticación para Upstash Redis |
| `NODE_ENV` | — | Gestionado por Next.js; no configurar manualmente |

Todas las vars son validadas con Zod al iniciar → si falta una requerida, el build falla con mensaje claro.
Ver esquema: `shared/config/env.schema.ts`.

---

## 3. Comandos disponibles

```bash
pnpm dev           # Dev server con hot-reload → localhost:3000
pnpm build         # Build de producción (valida tipos + genera assets)
pnpm start         # Servir el build de producción

pnpm lint          # ESLint (con auto-fix disponible: pnpm lint:fix)
pnpm typecheck     # TypeScript strict, 0 errores tolerados
pnpm format        # Prettier (auto-fix)
pnpm format:check  # Prettier (solo check, no modifica)

pnpm test          # Vitest — unit + component tests (no interactivo, ideal para CI)
pnpm test:watch    # Vitest en modo watch
pnpm test:coverage # Vitest con cobertura (mínimo 80% en archivos nuevos)
pnpm test:e2e      # Playwright — E2E tests
pnpm test:e2e:ui   # Playwright con UI interactiva
```

---

## 4. Arquitectura del proyecto

### 4.1 Estructura de carpetas

```
ambulante/
├── app/                      # Next.js App Router — solo rutas, layouts, páginas
│   ├── (client)/             # Rutas del rol Cliente → /map, /orders, /profile
│   ├── (store)/              # Rutas del rol Tienda → /store/dashboard, /store/catalog
│   ├── (admin)/              # Rutas del rol Administrador → /admin/*
│   └── (auth)/               # Rutas de autenticación → /login, /register
│
├── features/                 # Islas de lógica — una carpeta por feature
│   ├── map/                  # Mapa de tiendas cercanas
│   ├── orders/               # Flujo de pedido (enviar, seguir, aceptar)
│   ├── catalog/              # CRUD de productos de la tienda
│   ├── store-dashboard/      # Dashboard operativo de la tienda
│   ├── store-shell/          # Shell + disponibilidad de la tienda
│   ├── store-profile/        # Perfil público de la tienda
│   ├── store-onboarding/     # Alta y validación de tienda nueva
│   ├── store-validation/     # Panel admin de validación de tiendas
│   ├── admin-audit-log/      # Log de auditoría para admin
│   ├── auth/                 # Registro, login, reset de password
│   ├── cart/                 # Carrito de compra del cliente
│   ├── user-management/      # Gestión de usuarios (admin)
│   ├── content-moderation/   # Moderación de contenido (admin)
│   └── profile/              # Perfil del cliente
│
├── shared/                   # Todo lo reutilizable (usado en 2+ lugares)
│   ├── components/ui/        # Primitivas shadcn (Button, Card, Input…)
│   ├── components/           # Componentes compuestos reutilizables
│   ├── hooks/                # useGeolocation, useSession, useFlag…
│   ├── services/             # Clientes de datos (hoy mocks, mañana Supabase)
│   ├── repositories/         # Abstracción de acceso a datos
│   ├── domain/               # Lógica de dominio pura (state machine, eventos)
│   ├── schemas/              # Schemas Zod por entidad
│   ├── types/                # Tipos TypeScript globales
│   ├── constants/            # Constantes de dominio
│   ├── utils/                # Funciones puras genéricas
│   ├── config/               # Config de entorno y caché
│   ├── stores/               # Zustand stores (cart, ui)
│   ├── providers/            # QueryProvider, NuqsProvider, FlagsProvider
│   ├── query/                # React Query client y helpers
│   ├── test-utils/           # Utilidades de testing (render, mocks, factories)
│   └── REGISTRY.md           # 🔑 Índice vivo de todo lo disponible en shared/
│
├── docs/                     # Documentación del proyecto
│   ├── PRD.md                # Requisitos del producto (fuente de verdad)
│   ├── EPIC-ARCHITECTURE.md  # Plan de tareas y estado del epic
│   ├── ONBOARDING.md         # Este archivo
│   └── workflows/            # Guías de proceso (audit, review, verificación)
│
├── e2e/                      # Tests Playwright
└── public/                   # Assets estáticos
```

> **Nota:** `CLAUDE.md §4` usa nombres de feature ilustrativos (p.ej. `order-flow/`). El repo real usa nombres como `orders/`, `store-shell/`, etc. — los listados arriba son los nombres reales.
> El grupo de rutas `(auth)/` existe en el repo pero no aparece en `CLAUDE.md §4`; es la sección de autenticación (`/login`, `/register`, `/reset-password`).

### 4.2 Regla de promoción a `shared/`

```
Feature A necesita algo  ──► solo A lo usa ──► vive en features/A/
                         └──► 2+ features lo usan ──► va a shared/ + se documenta en REGISTRY.md
```

**Borrar una feature nunca debe romper otra.** Si dos features necesitan lo mismo, va a `shared/`.

### 4.3 Patrón Smart / Dumb (Container / Presentational)

Cada componente con lógica de datos se parte en dos:

```
ComponentName/
├── ComponentName.tsx            # Dumb — solo recibe props, renderiza JSX
├── ComponentName.container.tsx  # Smart — conecta datos (React Query, Zustand)
├── ComponentName.types.ts       # Tipos compartidos entre ambos
├── ComponentName.test.tsx       # Tests
└── index.ts                     # Re-export público
```

El componente **dumb** es puro y testeable. El **smart** no tiene JSX complejo.

### 4.4 Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS v4 |
| Componentes base | shadcn/ui + Radix UI |
| Formularios | react-hook-form + Zod |
| Server state | @tanstack/react-query v5 |
| Client state | Zustand (solo cuando hace falta) |
| URL state | nuqs |
| Mapas | react-map-gl + MapLibre GL JS (sin API key) |
| PWA / SW | serwist |
| Testing unit | Vitest + @testing-library/react |
| Testing E2E | Playwright |
| CI/CD | GitHub Actions → Vercel |
| Logging | Pino |
| Errores | Sentry |

---

## 5. Flujo de datos y roles

### 5.1 Tres roles, tres secciones de la app

```
Cliente ──────────────► app/(client)/
  └── Busca tiendas en el mapa
  └── Envía intención de compra
  └── Sigue el estado de su pedido

Tienda ───────────────► app/(store)/
  └── Gestiona catálogo de productos
  └── Activa/desactiva disponibilidad
  └── Acepta o rechaza pedidos entrantes

Administrador ────────► app/(admin)/
  └── Valida nuevas tiendas
  └── Modera contenido
  └── Revisa dashboard de métricas
```

### 5.2 Máquina de estados del pedido

```
[ENVIADO] ──► [RECIBIDO] ──► [ACEPTADO] ──► [EN_CAMINO] ──► [FINALIZADO]
                  │               │               │
                  ├──► [RECHAZADO]└──► [CANCELADO]└──► [CANCELADO]
                  ├──► [EXPIRADO]
                  └──► [CANCELADO]
```

| Estado | Actor que lo dispara |
|---|---|
| `ENVIADO` | Cliente |
| `RECIBIDO` | Sistema |
| `ACEPTADO` | Tienda |
| `RECHAZADO` | Tienda (desde `RECIBIDO`) — terminal |
| `EN_CAMINO` | Cliente |
| `FINALIZADO` | Tienda — terminal |
| `CANCELADO` (pre-`ACEPTADO`) | Cliente (desde `ENVIADO` o `RECIBIDO`) |
| `CANCELADO` (post-`ACEPTADO`) | Tienda (desde `ACEPTADO` o `EN_CAMINO`) |
| `EXPIRADO` | Sistema (timeout 10 min desde `RECIBIDO`) — terminal |

La implementación vive en `shared/domain/order-state-machine.ts`.

---

## 6. Glosario de dominio

| Término | Definición |
|---|---|
| **Ambulante** | Tienda móvil (food truck, puesto callejero, vendedor ambulante). |
| **Pedido** | Intención de compra enviada por un cliente a una tienda. No es una orden de pago — coordina un encuentro físico. |
| **Intención de compra** | El acto de un cliente de expresar que quiere comprar algo de una tienda en particular. La transacción económica ocurre en persona. |
| **Disponibilidad** | Estado operativo de una tienda: `activa` (visible en el mapa) o `inactiva`. |
| **Snapshot de producto** | Copia inmutable del producto al momento de crear el pedido. Si el vendedor edita el catálogo después, el pedido conserva los datos originales. |
| **Radio de búsqueda** | Distancia en km desde la posición del cliente para filtrar tiendas visibles en el mapa. Default: 2 km. |
| **Ubicación desactualizada** | Cuando una tienda activa no reporta su posición por más de 2 minutos. Se muestra un aviso al cliente. |
| **Estado terminal** | Estado del pedido del que no hay salida: `FINALIZADO`, `RECHAZADO`, `CANCELADO`, `EXPIRADO`. Inmutables. |
| **Timeout de pedido** | Si la tienda no responde en 10 minutos, el pedido pasa a `EXPIRADO` automáticamente. |
| **Auto-cierre** | Si un pedido `ACEPTADO` no se cierra manualmente en 2 horas, el sistema lo finaliza. |
| **PWA** | Progressive Web App — la app es instalable en el home screen y puede recibir notificaciones push, incluso con la pestaña cerrada. |
| **Service Worker (SW)** | Script que corre en background, gestiona el cache offline y las notificaciones push. Solo activo en producción. |
| **Offline queue** | Cola local (IndexedDB) para operaciones pendientes cuando el cliente pierde conexión. Se sincroniza al reconectarse. |
| **Feature flag** | Switch en `FlagsProvider` para activar/desactivar features sin deployar. Implementado en `shared/providers/FlagsProvider.tsx`. |
| **Rol** | Uno de los tres perfiles: `CLIENT`, `STORE`, `ADMIN`. Definidos en `shared/constants/user.ts`. |
| **Smart component** | Componente que conecta datos (React Query, Zustand) y delega el renderizado al dumb. Sufijo `.container.tsx`. |
| **Dumb component** | Componente puramente presentacional; solo recibe props, sin hooks de datos. Fácilmente testeable. |
| **REGISTRY.md** | Índice vivo de todo lo disponible en `shared/`. Consultar antes de crear algo nuevo para evitar duplicados. |
| **Conventional commits** | Formato de mensaje de commit: `feat:`, `fix:`, `refactor:`, `docs:`, etc. Obligatorio — husky lo valida. |

---

## 7. Primer PR — workflow completo

```bash
# 1. Crear una rama desde main
git checkout main && git pull
git checkout -b feat/mi-feature

# 2. Antes de escribir código — consultar el registro
# Leer shared/REGISTRY.md para ver si ya existe lo que necesitás

# 3. Escribir tests primero (TDD)
# Ver docs/workflows/ para protocolos de TDD y revisión

# 4. Implementar
pnpm typecheck    # 0 errores
pnpm lint         # 0 warnings
pnpm test         # todos verdes, cobertura ≥80%

# 5. Commit con conventional format
git commit -m "feat(orders): add cancel button on pending state"

# 6. Push + abrir PR
git push -u origin feat/mi-feature
# → usar el template en .github/pull_request_template.md
```

### Gates del PR (bloqueantes)

- [ ] `pnpm typecheck` → 0 errores
- [ ] `pnpm lint` → 0 errores, 0 warnings
- [ ] `pnpm test` → todos verdes, coverage ≥80%
- [ ] Ningún archivo de componente > 200 líneas
- [ ] Ningún archivo > 300 líneas
- [ ] Sin `any`, sin `as` injustificados
- [ ] Sin magic strings ni magic numbers
- [ ] REGISTRY.md actualizado si se tocó `shared/`

---

## 8. Links útiles

| Recurso | Ruta / URL |
|---|---|
| PRD (requisitos del producto) | `docs/PRD.md` |
| Epic y estado de tareas | `docs/EPIC-ARCHITECTURE.md` |
| Registro de shared | `shared/REGISTRY.md` |
| Reglas de código | `CLAUDE.md §6` |
| Invariantes de dominio | `CLAUDE.md §7` |
| Workflows de proceso | `docs/workflows/` |
| PR template | `.github/pull_request_template.md` |
| CI config | `.github/workflows/ci.yml` |
