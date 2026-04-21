# Contributing to Ambulante

Este documento te lleva desde cero hasta tu primer PR.
Para las reglas completas del proyecto, la fuente de verdad es [`CLAUDE.md`](./CLAUDE.md).

---

## Requisitos previos

| Herramienta    | Versión mínima | Verificar       |
|----------------|----------------|-----------------|
| Node.js        | 20+            | `node -v`       |
| pnpm           | 9+             | `pnpm -v`       |
| Git            | 2.38+ (worktrees) | `git --version` |

> **Por qué pnpm:** el repo usa `pnpm-lock.yaml`. Usar npm o yarn rompe el lockfile y puede introducir versiones distintas.

---

## Setup local

```bash
# 1. Cloná el repo
git clone <url-del-repo>
cd ambulante

# 2. Instalá dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env.local
# Editá .env.local — las variables requeridas están documentadas ahí

# 4. Levantá el servidor de dev
pnpm dev
# → http://localhost:3000
```

**No hay backend todavía.** Todos los datos se mockean en `shared/services/`. No necesitás credenciales externas para desarrollar features de frontend.

---

## Comandos

| Comando          | Qué hace                          |
|------------------|-----------------------------------|
| `pnpm dev`       | Dev server con hot reload         |
| `pnpm build`     | Build de producción               |
| `pnpm start`     | Servir el build de producción     |
| `pnpm lint`      | ESLint                            |
| `pnpm typecheck` | `tsc --noEmit` (0 errores = ok)   |
| `pnpm test`      | Vitest (unit + componentes, one-shot) |
| `pnpm test:watch`| Vitest en modo watch              |
| `pnpm test:coverage` | Vitest con reporte de cobertura |
| `pnpm test:e2e`  | Playwright (E2E)                  |

> **Service Worker:** solo corre en build de producción. Para testearlo: `pnpm build && pnpm start`.

---

## Arquitectura del proyecto

```
ambulante/
├── app/
│   ├── (client)/     # Rutas del rol Cliente
│   ├── (store)/      # Rutas del rol Tienda
│   └── (admin)/      # Rutas del rol Administrador
├── features/         # Una carpeta por feature, totalmente aislada
├── shared/           # Todo lo reutilizable (usado en 2+ lugares)
├── docs/             # PRD, epic, workflows
└── public/           # Assets estáticos
```

**Regla central:** si algo se usa en una sola feature → vive en `features/<nombre>/`. Si se usa en 2 o más → va a `shared/` y se documenta en `shared/REGISTRY.md`.

Al agregar una ruta nueva, elegí el grupo de `app/` que corresponde al rol: `(client)`, `(store)`, o `(admin)`.

### El REGISTRY tiene dos niveles

Antes de crear cualquier cosa nueva en `shared/`, seguí este protocolo (`CLAUDE.md §5`):

1. Leer `shared/REGISTRY.md` — índice rápido alfabético. ¿Aparece el nombre o la categoría?
2. Si hay candidatos → leer el detail file correspondiente en `shared/REGISTRY-detail/`:
   - `ui.md` — componentes UI, primitivas, layout, providers
   - `data.md` — query keys, hooks de datos, services, repositories
   - `domain.md` — tipos TS, schemas Zod, state machine, constantes
   - `infra.md` — utils, design tokens, config de entorno, stores Zustand
   - `features.md` — componentes/hooks de features existentes
   - `testing.md` — test utilities
3. Si ya existe → reutilizarlo. Si no → crearlo y actualizar tanto `REGISTRY.md` como el detail file correspondiente **en el mismo commit**.

---

## Flujo de trabajo con worktrees

Cada tarea se trabaja en un worktree aislado para no contaminar `main` ni bloquear otras ramas en paralelo.

```bash
# 1. Desde main limpio
git status --short   # debe estar vacío

# 2. Crear worktree con tu task ID
git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>

# 3. Instalar dependencias (node_modules NO se comparte entre worktrees)
cd ../ambulante-<task-id>
pnpm install

# 4. Trabajar. Nunca hacer cd al principal.
# Para comandos git sobre el principal: git -C /ruta/al/principal <cmd>

# 5. Al terminar — el merge y cleanup lo gestiona el workflow de cierre
```

---

## Tu primer PR

No sabés por dónde empezar → revisá `docs/NEXT-TASK.md` (pointer al estado actual del proyecto) y `docs/EPIC-ARCHITECTURE.md` (todas las tareas con su estado).

1. **Tomá una tarea** del epic marcada como `⚪ pending`.
2. **Verificá las dependencias** — la tarea tiene una lista `Depends on:`. Todas deben estar ✅ done.
3. **Creá el worktree** (ver sección anterior).
4. **Claim:** editá el estado a `🟡 in-progress [owner: tu-nombre, started: fecha]` y commiteá.
5. **Implementá** siguiendo `CLAUDE.md §6` (reglas de código) y `CLAUDE.md §8` (flujo esperado).
6. **Verificá antes de pedir review:**

```bash
pnpm typecheck   # 0 errores
pnpm test        # todos verdes
pnpm lint        # 0 warnings
wc -l <archivos-nuevos>   # ningún componente >200 líneas, ningún otro archivo >300
# Si tocaste shared/ → verificar que REGISTRY.md y el detail file estén actualizados
```

7. **Abrí el PR** apuntando a `main`. El título debe seguir conventional commits: `feat(fX.Y): descripción corta`.

---

## Convenciones de código

La referencia completa está en `CLAUDE.md §6`. Los puntos que más sorprenden a devs nuevos:

**TypeScript**
- `any` prohibido. Usar `unknown` + narrowing, o el tipo correcto.
- `as` casts requieren justificación con comentario.
- Validar con `zod` en todos los boundaries: inputs de usuario, respuestas externas, params de URL (`CLAUDE.md §6.1`).

**Componentes**
- Todo componente con datos o estado → split en `.tsx` (dumb) y `.container.tsx` (smart).
- **Server Components por defecto.** Marcar `"use client"` solo cuando hay interactividad, hooks, o APIs del browser — no por default (`CLAUDE.md §6.4.5`). En la práctica, `"use client"` casi siempre va en `.container.tsx` (que usa React Query/Zustand/handlers), no en el `.tsx` dumb.
- Máximo 200 líneas por archivo de componente; 300 para cualquier otro archivo (hard limit 400).

**Imports y estado**
- Imports absolutos con alias: `@/shared/...`, `@/features/...`. **Nunca `../../../`** (`CLAUDE.md §6.5.3`).
- Para filtros sincronizados con la URL → usar `nuqs`, no `useState` + `router.push`.
- Para formularios → usar `react-hook-form` (no controlled inputs con `useState`).
- Máximo 2 parámetros posicionales en funciones. Si hace falta un tercero → objeto con interfaz nombrada (`CLAUDE.md §6.3.2`).

**Inmutabilidad**
- Nunca mutar objetos existentes. Retornar siempre nuevas copias (`...spread`, `map`, `filter`). `const` por defecto, `let` solo si hay reasignación real. Ver `CLAUDE.md §6.6`.

**Nombres**
- Sin magic strings: `ORDER_STATUS.ACCEPTED` en vez de `"ACCEPTED"`. Ver `shared/constants/`.
- Código en inglés, copy de UI en español.

**Commits**
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- `husky` corre `prettier` en archivos staged via `lint-staged` — los reformatea antes del commit. Instalá la extensión de Prettier en tu editor y activá `formatOnSave` para evitar diffs de formato.
- `commitlint` rechaza mensajes que no cumplan el formato.

---

## Testing

- **Cobertura mínima:** 80% en archivos con lógica no trivial.
- **TDD obligatorio** para lógica de dominio: test primero (RED), implementación mínima (GREEN), refactor.
- Para componentes dumb sin branching: cubiertos por E2E, no necesitan unit test.

```bash
# Correr tests una vez
pnpm test

# Watch mode durante desarrollo
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E (Playwright) — correr localmente cuando tocás un flujo crítico de usuario
pnpm test:e2e
```

> **CI corre `pnpm test:e2e` automáticamente** en cada PR. Correlo localmente solo cuando tu cambio afecta un flujo crítico (map, order flow, etc.).

---

## Gotchas conocidos

- **Service Worker / PWA:** el proyecto usa `serwist`, **no `next-pwa`**. `next-pwa` está abandonado — no lo instales.
- **iOS Safari + Push:** las notificaciones push solo funcionan si el usuario instaló la PWA. Para usuarios no instalados, el sistema hace polling.
- **Geolocalización en dev:** usá Chrome DevTools → Sensors → Location para mockear coordenadas. No hardcodear coords en el código.
- **MapLibre sin API key:** el mapa usa MapLibre GL JS (open source). No necesitás configurar ninguna clave de mapa para el tile layer por defecto.

Para la lista completa de gotchas, ver `CLAUDE.md §9`.

---

## Preguntas frecuentes

**¿Dónde vive el estado del epic?**
En `docs/EPIC-ARCHITECTURE.md`. Ahí están todas las tareas con su estado, dependencias y notas.

**¿Cómo sé qué hay disponible en shared/?**
Leer `shared/REGISTRY.md` primero (índice). Si la categoría aparece en la tabla de routing, abrí el detail file correspondiente en `shared/REGISTRY-detail/`. Si lo que buscás no está ahí, no existe todavía.

**¿Puedo importar de otra feature?**
No. Si dos features necesitan lo mismo, lo correcto es moverlo a `shared/` y documentarlo en el REGISTRY.

**¿Cuándo uso Zustand vs React state?**
React state local primero. Zustand solo cuando el estado necesita cruzar componentes no relacionados. `@tanstack/react-query` v5 para server state — si venís de v4, la API cambió (ya no hay `onSuccess`/`onError` en `useQuery`; ver migration guide).
