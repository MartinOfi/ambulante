# Contributing to Ambulante

Este documento te lleva desde cero hasta tu primer PR.
Para las reglas completas del proyecto, la fuente de verdad es [`CLAUDE.md`](./CLAUDE.md).

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20+ | `node -v` |
| pnpm | 9+ | `pnpm -v` |
| Git | 2.38+ (para worktrees) | `git --version` |

> **Por qué pnpm:** el repo usa workspaces y `pnpm-lock.yaml`. Usar npm o yarn rompe el lockfile y puede introducir versiones distintas.

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

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Dev server con hot reload |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir el build de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` (0 errores = ok) |
| `pnpm test` | Vitest (unit + componentes) |
| `pnpm test:e2e` | Playwright (E2E) |

> **Service Worker:** solo corre en build de producción. Para testearlo: `pnpm build && pnpm start`.

---

## Arquitectura del proyecto

```
ambulante/
├── app/          # Next.js App Router — solo rutas, layouts, páginas
├── features/     # Una carpeta por feature, totalmente aislada
├── shared/       # Todo lo reutilizable (usado en 2+ lugares)
└── docs/         # PRD, epic, workflows
```

**Regla central:** si algo se usa en una sola feature → vive en `features/<nombre>/`. Si se usa en 2 o más → va a `shared/` y se documenta en `shared/REGISTRY.md`.

Antes de crear cualquier cosa nueva, leer:
1. `shared/REGISTRY.md` — índice de todo lo disponible en `shared/`
2. `CLAUDE.md §4` — arquitectura completa de carpetas
3. `CLAUDE.md §5` — protocolo del REGISTRY

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

1. **Tomá una tarea** del epic (`docs/EPIC-ARCHITECTURE.md`) marcada como `⚪ pending`.
2. **Verificá las dependencias** — la tarea tiene una lista `Depends on:`. Todas deben estar ✅ done.
3. **Creá el worktree** (ver sección anterior).
4. **Claim:** editá el estado de la tarea a `🟡 in-progress [owner: tu-nombre, started: fecha]` y commiteá.
5. **Implementá** siguiendo `CLAUDE.md §6` (reglas de código) y `CLAUDE.md §8` (flujo esperado).
6. **Verificá antes de pedir review:**

```bash
pnpm typecheck   # 0 errores
pnpm test        # todos verdes
pnpm lint        # 0 warnings
```

7. **Abrí el PR** apuntando a `main`. El título debe seguir conventional commits: `feat(fX.Y): descripción corta`.

---

## Convenciones de código

La referencia completa está en `CLAUDE.md §6`. Los puntos que más sorprenden a devs nuevos:

**TypeScript**
- `any` prohibido. Usar `unknown` + narrowing, o el tipo correcto.
- `as` casts requieren justificación con comentario.

**Componentes**
- Todo componente con datos o estado → split en `.tsx` (dumb) y `.container.tsx` (smart).
- Máximo 200 líneas por archivo de componente; 300 para cualquier otro archivo.

**Nombres**
- Sin magic strings: `ORDER_STATUS.ACCEPTED` en vez de `"ACCEPTED"`. Ver `shared/constants/`.
- Código en inglés, copy de UI en español.

**Commits**
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- El hook de `commitlint` rechaza mensajes que no cumplan el formato.

---

## Testing

- **Cobertura mínima:** 80% en archivos con lógica no trivial.
- **TDD obligatorio** para lógica de dominio: test primero (RED), implementación mínima (GREEN), refactor.
- Para componentes dumb sin branching: cubiertos por E2E, no necesitan unit test.

```bash
# Correr tests una vez
pnpm test

# Watch mode durante desarrollo
pnpm test -- --watch

# Coverage report
pnpm test -- --coverage
```

---

## Gotchas conocidos

- **iOS Safari + Push:** las notificaciones push solo funcionan si el usuario instaló la PWA. Para usuarios no instalados, el sistema hace polling.
- **Geolocalización en dev:** usá Chrome DevTools → Sensors → Location para mockear coordenadas. No hardcodear coords en el código.
- **MapLibre sin API key:** el mapa usa MapLibre GL JS (open source). No necesitás configurar ninguna clave de mapa para el tile layer por defecto.

Para la lista completa de gotchas, ver `CLAUDE.md §9`.

---

## Preguntas frecuentes

**¿Dónde vive el estado del epic?**
En `docs/EPIC-ARCHITECTURE.md`. Ahí están todas las tareas con su estado, dependencias y notas.

**¿Cómo sé qué hay disponible en shared/?**
Leer `shared/REGISTRY.md` primero. Si lo que buscás no está ahí, no existe todavía.

**¿Puedo importar de otra feature?**
No. Si dos features necesitan lo mismo, lo correcto es moverlo a `shared/` y documentarlo en el REGISTRY.

**¿Cuándo uso Zustand vs React state?**
React state local primero. Zustand solo cuando el estado necesita cruzar componentes no relacionados. `@tanstack/react-query` para server state.
