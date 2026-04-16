# EPIC — Arquitectura escalable Ambulante

> **Objetivo:** Llevar a Ambulante de un esqueleto con landing + mapa a una base arquitectónica comparable a una app como PedidosYa: lista para crecer en features, equipo y usuarios sin reescribir nada crítico.
>
> **Fuente de verdad del producto:** [`PRD.md`](./PRD.md)
> **Reglas de código y estructura:** [`../CLAUDE.md`](../CLAUDE.md)

---

## Cómo usar este documento

Este archivo es un **documento vivo**. Cualquier chat o agente puede tomar una tarea, ejecutarla y actualizar el estado acá mismo. El objetivo es permitir **trabajo paralelo** sin pisarse entre sí.

### Protocolo para tomar una tarea

1. **Abrir este archivo** y buscar tareas con estado `🟢 ready` (todas las dependencias `✅ done`).
2. **Marcar la tarea como `🟡 in-progress`** y anotar `[owner]: nombre-del-chat-o-fecha` en la misma línea.
3. **Ejecutar la tarea** respetando el entregable definido.
4. Al terminar:
   - Marcar como `✅ done`.
   - Actualizar el campo `Notas:` con cualquier decisión tomada o archivo relevante creado.
   - Si la tarea reveló subtareas nuevas, agregarlas al final de la fase como `Fx.N+1`.
5. **Nunca** tomar una tarea `🔴 blocked` sin antes resolver la decisión pendiente que la bloquea.

### Leyenda de estados

| Símbolo | Estado | Significado |
|---|---|---|
| ⚪ | `pending` | Todavía no lista (dependencias sin resolver) |
| 🟢 | `ready` | Todas las dependencias completas — puede arrancarse |
| 🟡 | `in-progress` | Alguien la está haciendo — no tocar |
| ✅ | `done` | Terminada, entregable verificado |
| 🔴 | `blocked` | Esperando una decisión del usuario |
| ⏸️ | `deferred` | Se mueve a un release futuro |

### Estimación de esfuerzo

| Sigla | Rango |
|---|---|
| **S** | < 2h |
| **M** | 2h–1 día |
| **L** | 1–3 días |
| **XL** | > 3 días (candidata a dividirse) |

### Decisiones pendientes globales

Antes de que cualquier fase dependiente se destrabe, estas decisiones deben tomarse. Marcar con ✅ al resolver:

- [ ] **DP-1 · Backend stack:** ¿Supabase (candidato default del CLAUDE.md) o alternativa? Afecta F2, F3, F4, F5.
- [ ] **DP-2 · Auth provider:** Supabase Auth / NextAuth / Clerk / custom. Afecta F2.
- [ ] **DP-3 · Observability stack:** Sentry + PostHog / Datadog / Grafana Cloud. Afecta F8.
- [ ] **DP-4 · Feature flags:** GrowthBook self-hosted / LaunchDarkly / Vercel Edge Config. Afecta F8.
- [ ] **DP-5 · Tile provider del mapa:** MapTiler / Stadia Maps / OSM self-hosted. Afecta F11.
- [ ] **DP-6 · Payments out-of-scope:** confirmar que nunca habrá pagos (PRD §2.3) — si cambia, replanificar F12.
- [ ] **DP-7 · Multi-país:** ¿MVP solo Argentina o multi-mercado desde el inicio? Afecta F10, F16.
- [ ] **DP-8 · Monorepo:** ¿quedarse en single repo o mover a Turborepo cuando entren apps paralelas (marketing, admin independiente)? Afecta F17.

---

## Cómo leer dependencias y paralelismo

Este doc tiene dos niveles de información sobre el orden:

1. **Dependencias explícitas** en cada tarea (`Depends on: F2.3, F3.1`).
2. **Ondas (waves) por fase**: grupos de tareas que pueden arrancarse al mismo tiempo en **chats distintos**.

### Regla general

> Dos tareas se pueden hacer **en paralelo** si ninguna depende (directa o transitivamente) de la otra, y si no escriben los mismos archivos.

### Ejemplo A — Serie (hay que esperar)

> "Para hacer el login, primero debe estar la lógica de autenticación con un interceptor."

Este caso es **serie** porque hay dependencias reales de código:

```
F2.1 (decisión provider)
  └─► F2.2 (User model)
        └─► F2.3 (auth service + useSession)
              └─► F2.4 (middleware interceptor)
                    └─► F2.5/2.6/2.7 (layouts protegidos)
                          └─► F2.8 (páginas de login/register)
                                └─► F2.9 (onboarding tienda)
```

Un solo chat debe hacer F2.1 → F2.2 → F2.3 → F2.4 en serie, porque cada uno construye sobre el anterior. **No se puede arrancar F2.8 antes de tener F2.3**, porque la página de login llama al `authService` que todavía no existe.

### Ejemplo B — Paralelo (dos chats al mismo tiempo)

> "Puedo hacer el mapa con tiendas en paralelo al dashboard de una tienda con sus datos."

Este caso es **paralelo** porque F12 (Cliente) y F13 (Tienda) son features distintas que comparten **solo** capas fundacionales:

```
        [Capas compartidas: F2, F3, F4, F5 completas]
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
         Chat A: F12             Chat B: F13
         (Cliente)               (Tienda)
         F12.1 mapa detail       F13.1 dashboard
         F12.2 cart              F13.2 availability toggle
         F12.3 submit order      F13.3 catalog CRUD
         F12.4 tracking          F13.4 inbox
         ...                     ...
```

Los dos chats **nunca tocan los mismos archivos**: Chat A trabaja en `features/map/` y `app/(client)/`; Chat B trabaja en `features/store-dashboard/` y `app/(store)/`. Comparten `shared/` **de solo lectura** (leen tipos, servicios y hooks pero no los modifican).

### Ejemplo C — Paralelo intra-fase

Dentro de **F1** (Capas transversales), casi todas las tareas son paralelizables porque no dependen entre sí:

```
Wave 1 (arrancan al mismo tiempo en 5 chats distintos):
├─ Chat α: F1.1 React Query provider
├─ Chat β: F1.3 Logger abstraction
├─ Chat γ: F1.4 Routes tipadas
├─ Chat δ: F1.6 Zustand setup
└─ Chat ε: F1.8 Design tokens

Wave 2 (después que terminen las de wave 1):
├─ F1.2 Query keys registry (necesita F1.1)
├─ F1.5 Error boundaries (necesita F1.3)
├─ F1.7 nuqs provider (necesita F0.1 — ya estaba listo)
├─ F1.9 Layout primitives (necesita F1.8)
└─ F1.10 Logger→Sentry stub (necesita F1.3)
```

### Reglas de seguridad para evitar conflictos en paralelo

Cuando dos chats trabajan al mismo tiempo:

0. **🚨 OBLIGATORIO — cada chat paralelo corre en su propio `git worktree`. Cero excepciones.**
   - **Por qué:** un repo git tiene un único `.git/HEAD`. Si dos chats comparten el mismo directorio físico (`~/Desktop/ambulante/`), cada `git checkout -b` de un chat le mueve la branch al otro y los commits aterrizan en branches equivocadas. Es un race condition determinístico, no mala suerte.
   - **Setup desde el worktree principal (`~/Desktop/ambulante/`, branch `main`):**
     ```bash
     git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
     ```
     Ejemplo concreto:
     ```bash
     git worktree add ../ambulante-f0-1 -b feat/f0-1-pnpm-migration
     git worktree add ../ambulante-f0-2 -b feat/f0-2-env-vars-zod
     git worktree add ../ambulante-f0-9 -b feat/f0-9-codeowners
     ```
   - **Cada chat de Claude se abre con `cd` al worktree correspondiente** *antes* de empezar a trabajar (`cd ~/Desktop/ambulante-f0-1 && claude`). Nunca trabajen 2 chats en el mismo cwd.
   - **Aislamiento garantizado por git:** worktrees comparten `.git/objects` y `.git/refs`, pero cada uno tiene su propio `HEAD` e índice. Git incluso bloquea checkear la misma branch en dos worktrees a la vez — el race condition se vuelve estructuralmente imposible.
   - **Bonus:** cada worktree tiene su propio `node_modules/` (está en `.gitignore`), lo que permite que F0.1 (migración a pnpm) corra en aislamiento total sin chocar con otros chats.
   - **Cleanup al terminar la tarea:** desde el worktree principal, `git worktree remove ../ambulante-<task-id>`.
1. **Archivos compartidos críticos** (lockearlos a un solo chat):
   - `package.json` / `pnpm-lock.yaml`
   - `tailwind.config.ts`
   - `tsconfig.json`
   - `next.config.mjs`
   - `shared/REGISTRY.md`
   - `docs/EPIC-ARCHITECTURE.md` (este doc)
2. **Regla anti-race:** antes de editar uno de esos archivos, marcar la tarea como 🟡 en este doc *primero* — así otro chat que esté por tocar el mismo archivo ve el claim.
3. **Escritura en `shared/` requiere coordinación**: si la tarea agrega un hook/util/tipo nuevo, es OK. Si modifica uno existente que otra tarea está usando, serializar.
4. **Features aisladas = siempre paralelas**: `features/map/*` y `features/store-dashboard/*` nunca chocan, son islas.
5. **Merge discipline:** cada chat en su propia branch (`feat/f2-3-auth-service`, `feat/f1-8-design-tokens`). PR por tarea.

---

## Cadenas de ejecución automática (auto-continuación)

Algunas tareas tienen un **sucesor natural** que debería ejecutarse en el **mismo chat** apenas termine la actual, sin abrir ventana nueva. Esto aparece en el epic como un campo:

```
- **Continues with:** F0.3
```

### Cómo funciona

- Si una tarea tiene `Continues with: Fx.y`, el chat que completa la tarea actual **claim automáticamente la siguiente** y reinicia el workflow de 7 pasos con ella.
- Si una tarea tiene `Continues with: —` o no tiene el campo, el chat **termina** después de esta tarea.
- La auto-continuación solo se dispara si la tarea sucesora está `🟢 ready` en el momento de chequear (todas sus dependencias `✅ done`). Si no, el chat avisa y termina.

### Cadenas definidas

| Cadena | Secuencia | Qué chat la ejecuta |
|---|---|---|
| **C-F0-eslint** | F0.1 → F0.3 → F0.4 | 1 chat del inicio hasta que F0.4 cierre |
| **C-F1-query** | F1.1 → F1.2 | 1 chat, React Query end-to-end |
| **C-F1-logger** | F1.3 → F1.10 | 1 chat, logger + Sentry stub |
| **C-F1-design** | F1.8 → F1.9 | 1 chat, tokens + layout primitives |
| **C-F2-core-auth** | F2.1 → F2.2 → F2.3 → F2.4 | 1 chat, auth en serie completa |
| **C-F2-onboarding** | F2.8 → F2.9 | 1 chat, login pages + store onboarding |
| **C-F3-state** | F3.2 → F3.5 → F3.6 | 1 chat, state machine + events + timeouts |
| **C-F4-pattern** | F4.1 → F4.2 | 1 chat, query + mutation patterns |
| **C-F5-realtime** | F5.1 → F5.2 | 1 chat, decisión + abstraction |
| **C-F12-order** | F12.3 → F12.4 | 1 chat, submit + tracking del pedido |

### Ejemplo práctico

El usuario abre 1 chat con `{{TASK_IDS}} = F0.1`. Ese chat:

1. Lee todo, claimea F0.1, ejecuta los 7 pasos.
2. Al cerrar F0.1 (paso 7), encuentra `Continues with: F0.3`.
3. Verifica que F0.3 esté 🟢 (lo está, porque su única dep era F0.1).
4. Claim F0.3 y reinicia el workflow de 7 pasos.
5. Al cerrar F0.3, encuentra `Continues with: F0.4`. Repite.
6. Al cerrar F0.4, no hay `Continues with`. El chat termina y reporta.

**Resultado:** 1 solo chat hizo 3 tareas seriales sin que el usuario abriera ventanas nuevas. Mientras, otros chats paralelos hacen F0.2, F0.5, F0.6, F0.8, F0.9 en simultáneo.

### Cadenas vs waves

- **Waves** = grupos **horizontales** de tareas que arrancan al mismo tiempo en **chats distintos**.
- **Chains** = secuencias **verticales** de tareas que ejecuta **un mismo chat** una tras otra.

Las dos cosas se combinan: en F0, abrís ~5 chats para wave 1 (F0.1 cadena, F0.2, F0.5, F0.6, F0.9), y mientras los chats de las cadenas avanzan por su lado, los standalone terminan y liberan nuevas tareas.

---

## Dependency map (alto nivel)

```
F0 ──► F1 ──► F2 ──┬──► F12
                    ├──► F13
                    └──► F14
         F1 ──► F3 ──► F4 ──► F5
         F1 ──► F6
         F1 ──► F7 (parallel-safe con todo)
         F1 ──► F8
         F1 ──► F9
         F1 ──► F10
         F1 ──► F11
         (F12|F13|F14) ──► F15 ──► F16 ──► F17 ──► F18
```

### Reglas de paralelismo a nivel fase

| # | Regla | Implicación práctica |
|---|---|---|
| 1 | **F0 es bloqueante total** | Ningún chat puede arrancar otra fase hasta que F0 esté ✅. |
| 2 | **F1 abre el abanico** | Apenas F1 esté completa, **10+ chats paralelos** pueden arrancar F2, F3, F6, F7, F8, F9, F10, F11 a la vez. |
| 3 | **F4 espera F3** | El data layer necesita el domain model. Serie. |
| 4 | **F5 espera F2+F3** | Realtime necesita auth (para permisos) y domain model (para eventos). Serie. |
| 5 | **Features (F12-F14) son trillizas paralelas** | Una vez F2+F3+F4+F5 listas, Cliente/Tienda/Admin se desarrollan **en paralelo total**. 3 chats simultáneos mínimo. |
| 6 | **F7 es paralelo con TODO** | Testing se puede arrancar desde F1 y progresar en paralelo a features. |
| 7 | **F15-F18 son de cierre** | Requieren features funcionando; no tiene sentido optimizar performance de código que todavía no existe. |

### Máximo teórico de chats concurrentes por etapa

| Etapa | Chats paralelos máx | Razón |
|---|---|---|
| Durante F0 | 2-3 | F0.1 (pnpm) bloquea varias; luego F0.2/F0.9 pueden ir en paralelo |
| Durante F1 | **5-6** | Casi todas las tareas de F1 son independientes |
| Durante F2 | 3 | F2.1-2.4 son serie; F2.5/2.6/2.7 (layouts) paralelos; F2.8/2.9 serie después |
| Durante F3 | 4 | F3.1 primero; después F3.2/3.4/3.7 paralelos |
| F6, F7, F8, F9, F10, F11 | **6+** | Todas paralelas entre sí una vez F1 listo |
| Features (F12-F14) | **3** (uno por rol) | Cliente/Tienda/Admin en 3 chats dedicados |
| F15-F18 | 2-3 | Cierre ordenado |

**Pico teórico de paralelismo:** ~10 chats concurrentes durante la ventana en que F6-F11 + F12-F14 están activas al mismo tiempo.

---

# FASE 0 — Infraestructura de desarrollo

**Goal:** Dejar el proyecto con las herramientas y gates de calidad mínimos antes de sumar cualquier capa arquitectónica.
**Acceptance criteria:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` corren limpios y están atados a CI en cada PR.

### Waves de F0 (paralelismo intra-fase)

```
Wave 1 (paralelo, 3 chats):
├─ Chat α: F0.1 pnpm migration ──┐
├─ Chat β: F0.2 env vars Zod     │  (F0.2 y F0.9 no dependen de nada;
└─ Chat γ: F0.9 codeowners       │   F0.1 bloquea wave 2)
                                 ▼
Wave 2 (después de F0.1, paralelo, 3 chats):
├─ Chat α: F0.3 ESLint + Prettier
├─ Chat β: F0.5 Vitest config
└─ Chat γ: F0.8 Upgrade Next 15
   (F0.6 Playwright también puede ir acá si se quiere un 4° chat)

Wave 3 (después de F0.3, serie):
├─ F0.4 Husky + commitlint   ← depende de F0.3
└─ F0.6 Playwright (si no se hizo antes)

Wave 4 (último, requiere F0.3+F0.5+F0.6):
└─ F0.7 GitHub Actions CI
```

**Lo que NO se puede paralelizar:** F0.4 necesita F0.3 armado; F0.7 necesita F0.3+F0.5+F0.6 porque configura los 3 en el workflow.

### F0.1 — Migrar npm → pnpm
- **Estado:** ✅ done
- **Por qué:** El CLAUDE.md lo exige; pnpm es más rápido y deduplicado.
- **Entregable:** `pnpm-lock.yaml` en el repo, `package-lock.json` borrado, scripts `pnpm dev/build/start` funcionando.
- **Archivos:** `package.json`, `.gitignore`, `package-lock.json` (borrar).
- **Depends on:** —
- **Continues with:** F0.3 (cadena C-F0-eslint)
- **Estimación:** S
- **Notas:** pnpm activado vía `corepack enable && corepack prepare pnpm@latest --activate` (pnpm 10.33.0). Agregado `"packageManager": "pnpm@10.33.0"` a `package.json` para lockear versión en Corepack. `package-lock.json` borrado, `pnpm-lock.yaml` generado (181 KB). Smoke test: `pnpm build` verde (8 páginas estáticas renderizadas). `.gitignore` ya listaba `node_modules/` y `.env*.local`, no hubo que tocarlo. Ejecutado desde worktree aislado `../ambulante-f0-1` para evitar race conditions con F0.2/F0.9. Nota transversal: F0.2 (env vars Zod) requiere `.env.local` con `NEXT_PUBLIC_APP_URL` para que el build no falle al arranque — documentar en F0.3/F0.7 si el CI necesita fake env vars.

### F0.2 — Configurar env vars tipadas con Zod
- **Estado:** ✅ done
- **Por qué:** Fallar fast al arranque si faltan vars, y tipar `process.env` en todo el código.
- **Entregable:** `shared/config/env.ts` con `z.object(...).parse(process.env)`; `.env.example` con todas las keys necesarias; import obligatorio desde `next.config.mjs` para validar en build.
- **Archivos:** `shared/config/env.ts` (nuevo), `.env.example` (nuevo), `next.config.mjs`.
- **Depends on:** —
- **Estimación:** S
- **Notas:** Implementado como trío: `env.mjs` (schema Zod + `parseEnv` puro, import-safe), `env.runtime.mjs` (side-effect `env = parseEnv(process.env)` para fail-fast al build), `env.ts` (re-export TS con tipo `Env`). Split necesario porque Next 14 `next.config.mjs` no puede importar `.ts` y porque los tests necesitan importar el schema sin disparar el side-effect. `next.config.mjs` importa `env.runtime.mjs` al tope. Schema actual: `NODE_ENV` (enum) + `NEXT_PUBLIC_APP_URL` (url). Dep `zod@^3.23.8` agregada. Tests en `shared/config/env.test.ts` (5 casos) listos para F0.5; validados vía smoke-run Node con 5/5 GREEN. REGISTRY actualizado con sección 9. Config.

### F0.3 — ESLint + Prettier
- **Estado:** ✅ done
- **Por qué:** Enforce coding style (CLAUDE.md §6) en cada commit. Hoy no corre porque ESLint no está configurado.
- **Entregable:** `.eslintrc.json` con config `next/core-web-vitals` + `@typescript-eslint` strict + regla `no-restricted-imports` que prohíba imports cruzados entre features (`features/x/*` no puede importar `features/y/*`). `.prettierrc`. `pnpm lint` pasa limpio.
- **Archivos:** `.eslintrc.json`, `.prettierrc`, `.prettierignore`.
- **Depends on:** F0.1
- **Continues with:** F0.4 (cadena C-F0-eslint)
- **Estimación:** M
- **Notas:** ESLint 8 (legacy `.eslintrc.json`) con `next/core-web-vitals` + `@typescript-eslint/recommended` + `eslint-config-prettier` (desactiva reglas de estilo que chocan con Prettier). Reglas duras: `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/consistent-type-imports: error`, `no-console: warn (allow warn/error)`, `no-restricted-imports` bloqueando imports `../*` (fuerza alias `@/`). Cross-feature isolation: overrides explícitos por feature (`features/landing/**` no puede importar `@/features/map/**` y viceversa). Cuando entren features nuevas, agregar su override al final del array. Next lint configurado con `eslint.dirs: ["app","features","shared"]` en `next.config.mjs` (por default next solo mira app/pages/components/lib/src). Prettier: `printWidth 100`, `semi true`, double quotes, `trailingComma all`. Scripts nuevos: `lint:fix`, `typecheck`, `format`, `format:check`. `.prettierignore` excluye docs/ y *.md del root (densos, edición manual) con excepción explícita para `shared/REGISTRY.md`. Fixes aplicados al codebase existente: 4 imports `../...` en `features/map/components/{EmptyRadius,MapScreen.container,NearbyBottomSheet}` convertidos a `@/features/map/...`; `shared/config/env.ts` ya no usa `typeof import()` (ahora importa `env` como value y exporta `type Env = typeof env`). Prettier auto-formateó 28 archivos de código (comillas dobles, trailing commas). Verificado: `pnpm lint` 0/0, `pnpm format:check` clean, `pnpm build` verde (8 páginas estáticas).

### F0.4 — Husky + lint-staged + commitlint
- **Estado:** ✅ done
- **Por qué:** Bloquear commits que rompan lint/format; enforzar conventional commits.
- **Entregable:** `husky/pre-commit` corre `lint-staged`; `husky/commit-msg` corre `commitlint`. Conventional commits obligatorios.
- **Archivos:** `.husky/*`, `commitlint.config.cjs`, `package.json` scripts.
- **Depends on:** F0.3
- **Estimación:** S
- **Notas:** `husky@9.1.7` inicializado con `pnpm exec husky init`; `prepare` script en package.json lo auto-activa en `pnpm install`. `.husky/pre-commit` ejecuta `pnpm exec lint-staged`. `.husky/commit-msg` ejecuta `pnpm exec commitlint --edit "$1"`. `commitlint.config.cjs` extends `@commitlint/config-conventional` con header-max-length 100 y body/footer-max-line-length 200 para permitir descripciones largas en commits de epic. `lint-staged` config en `package.json`: `*.{ts,tsx,js,jsx,mjs,cjs}` → `eslint --fix` + `prettier --write`; `*.{json,css,yml,yaml}` → `prettier --write`. Sanity verificado en vivo: (1) commit con mensaje sin type fue rechazado por commitlint con `subject-empty` + `type-empty`; (2) commit `feat(f0.4): ...` pasó, lint-staged corrió eslint/prettier sobre staged files y el commit llegó. Con esto, cualquier commit futuro queda blindado: no podés commitear con magic strings/any/imports malos, ni con mensajes fuera de conventional commits.

### F0.5 — Vitest config + primer test sanity
- **Estado:** ✅ done
- **Por qué:** Infraestructura de unit/component testing.
- **Entregable:** `vitest.config.ts`, `vitest.setup.ts` con testing-library, script `pnpm test`, un test dummy para `formatDistance` que corra verde.
- **Archivos:** `vitest.config.ts`, `vitest.setup.ts`, `shared/utils/format.test.ts`.
- **Depends on:** F0.1
- **Estimación:** M
- **Notas:** `vitest.config.ts` (30 líneas) con `@vitejs/plugin-react` (pineado a 4.7.0 — v6 usa sintaxis de .d.ts que TS 5.5 no parsea), `environment: "jsdom"`, alias `@/*` vía `fileURLToPath(new URL(".", import.meta.url))` para replicar `tsconfig.paths`, `setupFiles: ["./vitest.setup.ts"]`, `include: **/*.{test,spec}.{ts,tsx}`, `exclude: [node_modules, .next, e2e/**]` (e2e reservado para F0.6), coverage v8 con include `shared/**` + `features/**` excluyendo `shared/components/ui/**` (primitivas shadcn). `vitest.setup.ts`: 1 línea — `import "@testing-library/jest-dom/vitest"` (subpath `/vitest` registra matchers en expect de Vitest, no de Jest). Test `shared/utils/format.test.ts` (31 líneas, 4 casos formatDistance + 2 casos formatPrice) cubre 100% de `format.ts`. Env.test.ts preparado por F0.2 corre automáticamente con esta config (5 casos). Total: **9 tests verdes, 2 test files**. Deps agregadas: `@vitejs/plugin-react@4.7.0`, `jsdom@^25.0.1`, `@testing-library/react@^16.1.0`, `@testing-library/jest-dom@^6.6.3`, `@testing-library/user-event@^14.5.2`, `@vitest/coverage-v8@4.1.4`. Scripts nuevos en `package.json`: `test` (vitest run), `test:watch` (vitest), `test:coverage` (vitest run --coverage). Coverage global bajo a propósito (~9%) — se llena a medida que features/hooks/services ganan tests. Sin threshold gates en config para no bloquear el suite hasta que haya masa crítica. Peer warnings de pnpm aceptadas: plugin-react 4.x con vite 8 (runtime verde), @types/node 20.14 con vite 8 (compatible). Para F0.8/Next 15 se puede revisar upgrade a plugin-react 6 + TS 5.6+. Ejecutado desde worktree `../ambulante-f0-5`. Verificación: `pnpm typecheck` 0 err, `pnpm lint` 0 warn, `pnpm test` 9/9 GREEN.

### F0.6 — Playwright config + smoke test
- **Estado:** ✅ done
- **Por qué:** Infraestructura E2E.
- **Entregable:** `playwright.config.ts`, un test que visite `/` y verifique que la landing renderiza el hero.
- **Archivos:** `playwright.config.ts`, `e2e/landing.spec.ts`.
- **Depends on:** F0.1
- **Estimación:** M
- **Notas:** Creados `playwright.config.ts` (chromium only, webServer con `pnpm dev --port 3100` para aislar del puerto 3000 que usan otros worktrees), `e2e/landing.spec.ts` (visita `/` y verifica `h1` con texto "Todo lo ambulante"). Scripts `test:e2e` y `test:e2e:ui` agregados a `package.json`. `.gitignore` actualizado con `test-results/`, `playwright-report/`, `playwright/.cache/`, `blob-report/`. `webServer.env` inyecta `NEXT_PUBLIC_APP_URL` para cumplir con el schema Zod de F0.2. Test GREEN (1 passed).

### F0.7 — GitHub Actions CI
- **Estado:** ⚪ pending
- **Por qué:** Cada PR debe pasar lint + typecheck + test antes de merge.
- **Entregable:** `.github/workflows/ci.yml` con jobs `lint`, `typecheck`, `test-unit`, `test-e2e`, `build`. Matrix node 20.
- **Archivos:** `.github/workflows/ci.yml`.
- **Depends on:** F0.3, F0.5, F0.6
- **Estimación:** M
- **Notas:**

### F0.8 — Upgrade a Next.js 15
- **Estado:** ✅ done
- **Por qué:** CLAUDE.md §2 pide Next 15. Hoy estamos en 14.2.5. Cuanto antes, menos deuda de async params.
- **Entregable:** Next 15 instalado, async params de rutas adaptados, build verde.
- **Archivos:** `package.json`, rutas que usen `params`.
- **Depends on:** F0.1
- **Estimación:** M
- **Notas:** Bump a `next@15.5.15` + `react@19.2.5` + `react-dom@19.2.5` + `@types/react@19.2.14` + `@types/react-dom@19.2.3` + `eslint-config-next@15.5.15`. No hubo rutas dinámicas (`[param]`) ni uso de `cookies()/headers()/draftMode()/searchParams` en la base, así que la migración de async APIs fue no-op. `next-env.d.ts` se autoregeneró con la `reference path` a `.next/types/routes.d.ts` (typed routes). `.env.local` creado en el worktree desde `.env.example` para permitir build/lint (validador Zod de F0.2 lo exige; sigue gitignored). `next lint` quedó warning de deprecación — migración a ESLint CLI directa queda como sub-tarea futura (seguramente F0.3.1 o dentro de F0.7/CI). Gates verdes: typecheck 0, lint 0, build 8 páginas estáticas, vitest 5/5. Ejecutado desde worktree `../ambulante-f0-8` en branch `feat/f0-8`. Tarea standalone, sin `Continues with:`.

### F0.9 — Codeowners + PR template
- **Estado:** ✅ done
- **Por qué:** Cuando entre equipo, queremos reviewers asignados por path y PRs con checklist.
- **Entregable:** `.github/CODEOWNERS`, `.github/pull_request_template.md`.
- **Archivos:** `.github/*`.
- **Depends on:** —
- **Estimación:** S
- **Notas:** Creados `.github/CODEOWNERS` (56 líneas, fallback `@martinOfi` + reglas por path para `shared/`, `app/`, `features/*`, `docs/`, infra root) y `.github/pull_request_template.md` (43 líneas, checklist de gates de CLAUDE.md §6/§7 + link a EPIC y REGISTRY). Placeholders `# TODO(team): @ambulante/<squad>` para escalar cuando entre equipo. Tarea standalone, sin `Continues with:`.

---

# FASE 1 — Capas transversales fundacionales

**Goal:** Dejar las capas cross-cutting que toda feature va a consumir: logging, errores, rutas, tokens, data client.
**Acceptance criteria:** Existe un único lugar canónico para cada preocupación (logging, routes, errors, tokens, query client, design tokens).

### Waves de F1 (paralelismo intra-fase) — PICO DE PARALELISMO

**Esta es la fase que más se beneficia de trabajo en paralelo.** Son 10 tareas con muy pocas dependencias entre sí.

```
Wave 1 (5-6 chats en paralelo, todas independientes):
├─ Chat α: F1.1 React Query provider
├─ Chat β: F1.3 Logger abstraction
├─ Chat γ: F1.4 Routes tipadas         ← archivo propio, no choca con nada
├─ Chat δ: F1.6 Zustand setup base     ← archivo propio
├─ Chat ε: F1.7 nuqs provider          ← archivo propio
└─ Chat ζ: F1.8 Design tokens tipados  ← ⚠️ modifica tailwind.config.ts, coordinar

Wave 2 (paralelo, después que terminen dependencias):
├─ F1.2 Query keys registry     ← depende de F1.1
├─ F1.5 Error boundaries         ← depende de F1.3
├─ F1.9 Layout primitives        ← depende de F1.8
└─ F1.10 Logger→Sentry stub      ← depende de F1.3
```

**Archivos compartidos que requieren coordinación:**
- `tailwind.config.ts`: **solo** F1.8 y F1.9 lo tocan. Serializarlas.
- `app/layout.tsx`: F1.1 (QueryProvider) y F1.7 (NuqsProvider) lo tocan. Coordinar con merge sequencial o un solo chat haciendo ambas.

**Conflictos no obvios:**
- F1.1 (React Query provider) y F1.7 (nuqs provider) **ambos envuelven `app/layout.tsx`** → mejor hacerlas secuencialmente o en un solo chat.
- F1.8 (tokens) y F9.1 (escala spacing) tocan `tailwind.config.ts`. F9.1 es de otra fase pero si se arranca antes de tiempo, choca.

### F1.1 — React Query provider + QueryClient config
- **Estado:** ⚪ pending
- **Por qué:** `useNearbyStores` hoy usa `useState+useEffect` — sin caché, sin dedupe. Toda feature de datos lo va a necesitar.
- **Entregable:** `shared/providers/QueryProvider.tsx` con `QueryClient` tipado; integrado en `app/layout.tsx`. Devtools habilitadas en dev.
- **Archivos:** `shared/providers/QueryProvider.tsx`, `app/layout.tsx`, `package.json`.
- **Depends on:** F0.*
- **Continues with:** F1.2 (cadena C-F1-query)
- **Estimación:** M
- **Notas:**

### F1.2 — Query keys registry
- **Estado:** ⚪ pending
- **Por qué:** Invalidaciones cruzadas necesitan keys centralizadas y tipadas. Sin esto, el caché se fragmenta.
- **Entregable:** `shared/query/keys.ts` exportando `queryKeys` con factories tipadas por dominio (`stores.nearby(coords, radius)`, `orders.byUser(userId)`, etc.).
- **Archivos:** `shared/query/keys.ts`.
- **Depends on:** F1.1
- **Estimación:** S
- **Notas:**

### F1.3 — Logger abstraction
- **Estado:** ⚪ pending
- **Por qué:** `console.log` está prohibido (§TS hooks) pero no hay reemplazo. Cada catch hoy no sabe qué hacer con errores.
- **Entregable:** `shared/utils/logger.ts` con interfaz `{ debug, info, warn, error }`; implementación dev = console, prod = pluggable (stub inicial para Sentry en F8).
- **Archivos:** `shared/utils/logger.ts`.
- **Depends on:** —
- **Continues with:** F1.10 (cadena C-F1-logger)
- **Estimación:** S
- **Notas:**

### F1.4 — Routes tipadas
- **Estado:** ⚪ pending
- **Por qué:** Hoy `"/map"` es un magic string repetido por 8 lugares. Cualquier rename rompe y el compilador no lo nota.
- **Entregable:** `shared/constants/routes.ts` con `ROUTES.client.map`, `ROUTES.store.dashboard`, etc. Helper `href(route, params?)` tipado.
- **Archivos:** `shared/constants/routes.ts`.
- **Depends on:** —
- **Estimación:** S
- **Notas:**

### F1.5 — Error boundaries y error/loading states globales
- **Estado:** ⚪ pending
- **Por qué:** Un throw en cualquier service hoy rompe la app con pantalla blanca. Next tiene `error.tsx`, `loading.tsx`, `not-found.tsx`.
- **Entregable:** `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` globales con diseño consistente. Lo mismo por route group (ver F2.3+).
- **Archivos:** `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`.
- **Depends on:** F1.3
- **Estimación:** M
- **Notas:**

### F1.6 — Zustand setup base
- **Estado:** ⚪ pending
- **Por qué:** El CLAUDE.md lista Zustand para client state global. Sin una convención armada, el equipo va a mezclar todo.
- **Entregable:** `shared/stores/` con un store de ejemplo (ej. UI preferences) usando `create` + `persist` + slices pattern. Doc en REGISTRY.md con la convención.
- **Archivos:** `shared/stores/ui.ts`.
- **Depends on:** F0.1
- **Estimación:** S
- **Notas:**

### F1.7 — nuqs para URL state
- **Estado:** ⚪ pending
- **Por qué:** El radio del mapa hoy es `useState` — se pierde al refrescar. Filtros que cambian la UI deben vivir en URL.
- **Entregable:** `nuqs` instalado + provider; `features/map/hooks/useRadiusParam.ts` reemplaza el useState del radio. Refresh preserva estado.
- **Archivos:** `shared/providers/NuqsProvider.tsx`, `features/map/hooks/useRadiusParam.ts`, container del mapa.
- **Depends on:** F0.1
- **Estimación:** S
- **Notas:**

### F1.8 — Design tokens tipados
- **Estado:** ⚪ pending
- **Por qué:** Hoy los tokens son solo CSS vars — no se pueden leer runtime ni tipar. Tailwind los tiene como strings.
- **Entregable:** `shared/styles/tokens.ts` con objetos `colors`, `spacing`, `radius`, `shadows`, `motion` tipados. Single source of truth que también se re-exporta a `tailwind.config.ts`.
- **Archivos:** `shared/styles/tokens.ts`, `tailwind.config.ts`.
- **Depends on:** —
- **Continues with:** F1.9 (cadena C-F1-design)
- **Estimación:** M
- **Notas:**

### F1.9 — Layout primitives
- **Estado:** ⚪ pending
- **Por qué:** Sin primitivas (`Stack`, `Row`, `Container`, `Screen`, `Spacer`), cada pantalla reinventa padding/gap.
- **Entregable:** `shared/components/layout/` con `Stack`, `Row`, `Container`, `Screen`, `Spacer`, `Divider`. Props polimórficas (`as`).
- **Archivos:** `shared/components/layout/*`.
- **Depends on:** F1.8
- **Estimación:** M
- **Notas:**

### F1.10 — Logger→Sentry stub
- **Estado:** ⚪ pending
- **Por qué:** Preparar el hook para cuando F8 instale Sentry real — evita refactor doble.
- **Entregable:** `logger.error` tiene un side-effect hook noop que F8.1 reemplazará.
- **Archivos:** `shared/utils/logger.ts`.
- **Depends on:** F1.3
- **Estimación:** S
- **Notas:**

---

# FASE 2 — Auth + roles + shells de ruta

**Goal:** Auth funcionando end-to-end con los tres roles del PRD (Cliente, Tienda, Admin) estrictamente aislados.
**Acceptance criteria:** Un cliente no puede acceder a rutas de tienda/admin. middleware.ts bloquea a nivel edge. Cada role group tiene su layout con navegación apropiada.

### Waves de F2 (la fase con más serie en todo el epic)

**⚠️ Esta es la fase donde tu ejemplo del login aplica.** Auth tiene un core serial inevitable (provider → model → service → interceptor) y después se abre.

```
Wave 1 (serie — un solo chat, NO paralelizable):
└─ F2.1 Decisión de auth provider  🔴 bloquea todo F2
      │
      ▼
Wave 2 (paralelo, 2 chats):
├─ Chat α: F2.2 User model + types  ← depende de F2.1 + F3.1
└─ Chat β: F3.1 Schemas Zod base    ← se puede arrancar antes desde F3
      │
      ▼
Wave 3 (serie — un solo chat):
└─ F2.3 Auth service + useSession  ← aquí vive la "lógica de autenticación"
      │
      ▼
Wave 4 (serie — un solo chat):
└─ F2.4 middleware.ts  ← el "interceptor" de tu ejemplo
      │
      ▼
Wave 5 (paralelo, 3-4 chats — ACÁ SE ABRE LA FASE):
├─ Chat α: F2.5 Layout Cliente  ← features/client-shell/*
├─ Chat β: F2.6 Layout Tienda   ← features/store-shell/*
├─ Chat γ: F2.7 Layout Admin    ← features/admin-shell/*
└─ Chat δ: F2.8 Login/register pages ← app/(auth)/*
      │
      ▼
Wave 6 (serie — depende de F2.8):
└─ F2.9 Onboarding tienda multi-step
```

**Por qué waves 1-4 son inevitablemente serie:**

- F2.1 → F2.2: No podés modelar `User` sin saber si el provider usa `auth.users` de Supabase o su propio schema de NextAuth.
- F2.2 → F2.3: No podés escribir `authService.signIn()` sin tener el tipo `User` y `Session`.
- F2.3 → F2.4: El middleware lee la sesión — necesita `getSession()` funcionando.

**Por qué wave 5 se abre a 3-4 chats:**

Cada layout vive en **archivos distintos y aislados**:
- `app/(client)/layout.tsx` + `features/client-shell/*`
- `app/(store)/layout.tsx` + `features/store-shell/*`
- `app/(admin)/layout.tsx` + `features/admin-shell/*`

No hay archivos compartidos entre ellos (salvo `shared/` de solo lectura). F2.8 (páginas de login) también es independiente: vive en `app/(auth)/*` y `features/auth/*`.

**Tu ejemplo del login corresponde a esta fase exacta:** primero se construye la lógica (F2.3) y el interceptor (F2.4), recién después se puede paralelizar la página de login con los layouts.

### F2.1 — Decisión de auth provider
- **Estado:** 🔴 blocked (DP-2)
- **Por qué:** Todas las tareas de F2 dependen de saber si usamos Supabase Auth, NextAuth, Clerk, o propio.
- **Entregable:** Decisión documentada acá mismo + ADR en `docs/adr/0001-auth-provider.md`.
- **Depends on:** DP-2
- **Continues with:** F2.2 (cadena C-F2-core-auth)
- **Estimación:** S (solo la decisión)
- **Notas:**

### F2.2 — Modelo de User + roles
- **Estado:** ⚪ pending
- **Por qué:** Necesitamos el tipo canónico antes de tocar session.
- **Entregable:** `shared/types/user.ts` con `User`, `UserRole = "client" | "store" | "admin"`, `Session`. Schemas Zod en `shared/schemas/user.ts`.
- **Archivos:** `shared/types/user.ts`, `shared/schemas/user.ts`.
- **Depends on:** F2.1, F3.1
- **Continues with:** F2.3 (cadena C-F2-core-auth)
- **Estimación:** S
- **Notas:**

### F2.3 — Auth service + session hook
- **Estado:** ⚪ pending
- **Por qué:** Abstracción para que el provider elegido se pueda swapear.
- **Entregable:** `shared/services/auth.ts` con `AuthService` interface (`signIn`, `signUp`, `signOut`, `getSession`). Implementación según DP-2. `shared/hooks/useSession.ts`.
- **Archivos:** `shared/services/auth.ts`, `shared/hooks/useSession.ts`.
- **Depends on:** F2.1, F2.2
- **Continues with:** F2.4 (cadena C-F2-core-auth)
- **Estimación:** L
- **Notas:**

### F2.4 — middleware.ts con role gating
- **Estado:** ⚪ pending
- **Por qué:** PRD §7.4 exige "permisos estrictamente separados". Gating debe ser edge-side.
- **Entregable:** `middleware.ts` que lee sesión, matchea path contra role y redirige si no coincide. Test E2E por rol.
- **Archivos:** `middleware.ts`, `e2e/auth.spec.ts`.
- **Depends on:** F2.3
- **Estimación:** M
- **Notas:**

### F2.5 — Layout del route group Cliente
- **Estado:** ⚪ pending
- **Por qué:** Bottom nav mobile-first, shell específico del rol.
- **Entregable:** `app/(client)/layout.tsx` con `<ClientShell>`: header mínimo, bottom nav, safe areas. Rutas de ejemplo vacías para `/orders`, `/profile`.
- **Archivos:** `app/(client)/layout.tsx`, `features/client-shell/*`.
- **Depends on:** F2.4, F1.9
- **Estimación:** M
- **Notas:**

### F2.6 — Layout del route group Tienda
- **Estado:** ⚪ pending
- **Por qué:** Dashboard-style shell con toggle de disponibilidad siempre visible.
- **Entregable:** `app/(store)/layout.tsx` con `<StoreShell>`: sidebar o tabbed nav, availability toggle persistente.
- **Archivos:** `app/(store)/layout.tsx`, `features/store-shell/*`.
- **Depends on:** F2.4, F1.9
- **Estimación:** M
- **Notas:**

### F2.7 — Layout del route group Admin
- **Estado:** ⚪ pending
- **Por qué:** Desktop-first, sidebar con secciones.
- **Entregable:** `app/(admin)/layout.tsx` con `<AdminShell>`: sidebar izquierdo, header con user menu.
- **Archivos:** `app/(admin)/layout.tsx`, `features/admin-shell/*`.
- **Depends on:** F2.4, F1.9
- **Estimación:** M
- **Notas:**

### F2.8 — Páginas públicas de auth
- **Estado:** ⚪ pending
- **Por qué:** Login, register, forgot-password, reset-password.
- **Entregable:** `app/(auth)/login`, `app/(auth)/register`, `app/(auth)/forgot-password`, `app/(auth)/reset-password` — cada una con container/presentational.
- **Archivos:** `app/(auth)/*`, `features/auth/*`.
- **Depends on:** F2.3, F1.9
- **Continues with:** F2.9 (cadena C-F2-onboarding)
- **Estimación:** L
- **Notas:**

### F2.9 — Onboarding de tienda (multi-step)
- **Estado:** ⚪ pending
- **Por qué:** Una tienda al registrarse queda en estado `pending-approval` hasta que admin valide (A1).
- **Entregable:** Flow multi-step `app/(auth)/register/store/*` con datos fiscales, zona, horarios. Página `app/(store)/pending-approval`.
- **Archivos:** `app/(auth)/register/store/*`, `features/store-onboarding/*`.
- **Depends on:** F2.8
- **Estimación:** L
- **Notas:**

---

# FASE 3 — Domain model como código

**Goal:** Todas las invariantes del dominio del PRD §6 y §7 expresadas como tipos, schemas, y máquinas de estado — no como texto en el PRD.
**Acceptance criteria:** Es imposible representar en TypeScript una transición de pedido inválida, un `ProductSnapshot` mutable, o una `Order` sin sus timestamps de auditoría.

### Waves de F3

```
Wave 1 (serie — un solo chat):
└─ F3.1 Schemas Zod base  ← todos los demás heredan tipos de acá
      │
      ▼
Wave 2 (paralelo, 4 chats — se abre todo):
├─ Chat α: F3.2 Order state machine  ← shared/domain/order-state-machine.ts
├─ Chat β: F3.3 Product snapshot      ← shared/domain/product-snapshot.ts
├─ Chat γ: F3.4 Repository interfaces ← shared/repositories/*
└─ Chat δ: F3.7 Constants del dominio ← shared/constants/{order,user}.ts
      │
      ▼
Wave 3 (paralelo, 2 chats, después de F3.2):
├─ Chat α: F3.5 Domain events + bus  ← depende de F3.2
└─ Chat β: F3.6 Timeouts policies    ← depende de F3.2 + F3.5
```

**Conflicto potencial:** F3.2 y F3.4 ambos referencian tipos en `shared/types/` — si F3.1 los dejó correctamente, no chocan.

### F3.1 — Schemas Zod base + tipos inferidos
- **Estado:** ⚪ pending
- **Por qué:** Single source of truth para runtime validation + compile-time types.
- **Entregable:** `shared/schemas/{store,product,user,coordinates}.ts` con Zod. Tipos inferidos en `shared/types/*` re-exportan desde schemas.
- **Archivos:** `shared/schemas/*`, `shared/types/*`.
- **Depends on:** F0.1
- **Estimación:** M
- **Notas:**

### F3.2 — Order state machine tipada
- **Estado:** ⚪ pending
- **Por qué:** PRD §6 define la máquina de estados del pedido — es **la invariante principal del producto**. Debe ser imposible compilar una transición inválida.
- **Entregable:** `shared/domain/order-state-machine.ts` con discriminated union por estado, función `transition(order, event, actor)` que retorna `Result<Order, TransitionError>`. Test con todos los casos del §6.1 del PRD.
- **Archivos:** `shared/domain/order-state-machine.ts`, `shared/domain/order-state-machine.test.ts`.
- **Depends on:** F3.1
- **Continues with:** F3.5 (cadena C-F3-state)
- **Estimación:** L
- **Notas:**

### F3.3 — Product snapshot invariante
- **Estado:** ⚪ pending
- **Por qué:** PRD §9.2 / CLAUDE §7.4 — al crear un pedido se guarda snapshot inmutable del producto.
- **Entregable:** `ProductSnapshot` como type `Readonly<Product>` con brand type para distinguirlo; helper `snapshot(product): ProductSnapshot`.
- **Archivos:** `shared/domain/product-snapshot.ts`.
- **Depends on:** F3.1
- **Estimación:** S
- **Notas:**

### F3.4 — Repository interfaces
- **Estado:** ⚪ pending
- **Por qué:** Abstraer acceso a datos detrás de interfaces para swappear mock → Supabase sin tocar consumidores.
- **Entregable:** `shared/repositories/{store,order,user,product}.ts` con interfaces `Repository<T>`. Implementaciones mock en `shared/repositories/mock/*`. Rewiring del `storesService` actual para que use `storeRepository`.
- **Archivos:** `shared/repositories/*`.
- **Depends on:** F3.1
- **Estimación:** L
- **Notas:**

### F3.5 — Domain events + bus
- **Estado:** ⚪ pending
- **Por qué:** Cuando un pedido cambia de estado, varias partes del sistema reaccionan (notificaciones, KPIs, audit log). Event bus desacopla.
- **Entregable:** `shared/domain/events.ts` con tipos de evento (`OrderAccepted`, `OrderExpired`, etc.). `shared/domain/event-bus.ts` implementación local simple (pub/sub en memoria) con hook de serialización para F5 realtime.
- **Archivos:** `shared/domain/events.ts`, `shared/domain/event-bus.ts`.
- **Depends on:** F3.2
- **Continues with:** F3.6 (cadena C-F3-state)
- **Estimación:** M
- **Notas:**

### F3.6 — Timeouts y jobs de sistema
- **Estado:** ⚪ pending
- **Por qué:** PRD §7.6: `EXPIRADO` a los 10min sin respuesta, auto-cierre a las 2h. Estos son eventos del sistema, no del usuario.
- **Entregable:** `shared/domain/timeouts.ts` con políticas declarativas por estado. Integrado en repository (Supabase-side: cron; mock-side: setTimeout con cleanup).
- **Archivos:** `shared/domain/timeouts.ts`.
- **Depends on:** F3.2, F3.5
- **Estimación:** M
- **Notas:**

### F3.7 — Constants del dominio
- **Estado:** ⚪ pending
- **Por qué:** CLAUDE §6.2 — prohibido magic strings/numbers. Todos los valores del PRD como constantes tipadas.
- **Entregable:** `shared/constants/order.ts` (`ORDER_STATUS`, `ORDER_EXPIRATION_MINUTES`, `ORDER_AUTOCLOSE_HOURS`). `shared/constants/user.ts` (`USER_ROLES`). Actualización del REGISTRY.md.
- **Archivos:** `shared/constants/*`.
- **Depends on:** —
- **Estimación:** S
- **Notas:**

---

# FASE 4 — Data layer hardening

**Goal:** Todos los accesos a datos pasan por React Query hooks consistentes, con cache, retry, invalidación y Zod parsing en el boundary.
**Acceptance criteria:** No queda un solo `useState+useEffect` manual para data fetching. Todo pasa por `use*Query` / `use*Mutation`.

### Waves de F4

```
Wave 1 (paralelo, 3 chats):
├─ Chat α: F4.3 Zod parseResponse helper  ← archivo aislado
├─ Chat β: F4.4 Retry + offline policies  ← toca QueryProvider (coordinar con F4.5)
└─ Chat γ: F4.5 Toaster + error handling  ← toca QueryProvider
      │
      ▼
Wave 2 (serie después de F4.3):
└─ F4.1 Pattern useXxxQuery (establece convención) ← todos los hooks de data futuros lo siguen
      │
      ▼
Wave 3 (después de F4.1):
└─ F4.2 Pattern useXxxMutation (optimistic updates)
```

**⚠️ Coordinación:** F4.4 y F4.5 ambos editan `shared/providers/QueryProvider.tsx`. Si se hacen en paralelo, mergear con cuidado o ponerlos en serie.

### F4.1 — Pattern para queries: `useXxxQuery` wrapping repository
- **Estado:** ⚪ pending
- **Por qué:** Convención para que todos los hooks de data luzcan igual.
- **Entregable:** Ejemplo canónico `features/map/hooks/useStoresNearbyQuery.ts` + doc con la receta. Reemplaza `useNearbyStores` actual.
- **Archivos:** `features/map/hooks/useStoresNearbyQuery.ts`, `shared/REGISTRY.md`.
- **Depends on:** F1.1, F1.2, F3.4
- **Continues with:** F4.2 (cadena C-F4-pattern)
- **Estimación:** M
- **Notas:**

### F4.2 — Pattern para mutations con optimistic updates
- **Estado:** ⚪ pending
- **Por qué:** Acciones del usuario (aceptar pedido, cancelar, etc.) deben sentirse instantáneas.
- **Entregable:** Ejemplo canónico `features/orders/hooks/useAcceptOrderMutation.ts` con `onMutate`/`onError` rollback. Doc con la receta.
- **Archivos:** ejemplo + doc.
- **Depends on:** F4.1, F3.2
- **Estimación:** M
- **Notas:**

### F4.3 — Zod parsing en el boundary
- **Estado:** ⚪ pending
- **Por qué:** Toda respuesta externa debe pasar por `schema.parse()` antes de entrar al store de React Query.
- **Entregable:** Helper `shared/query/parseResponse.ts` que acepta schema + promise y retorna parseado o throw tipado. Convención documentada.
- **Archivos:** `shared/query/parseResponse.ts`.
- **Depends on:** F3.1
- **Estimación:** S
- **Notas:**

### F4.4 — Retry y offline policies
- **Estado:** ⚪ pending
- **Por qué:** App móvil con conexión inestable necesita retry inteligente (backoff exponencial, no retry en 4xx).
- **Entregable:** QueryClient config actualizada con `retry`, `retryDelay`, `networkMode`. Test con mock de red flaky.
- **Archivos:** `shared/providers/QueryProvider.tsx`.
- **Depends on:** F1.1
- **Estimación:** S
- **Notas:**

### F4.5 — Error handling estándar con toast
- **Estado:** ⚪ pending
- **Por qué:** Cada mutation error debe mostrar feedback humano consistente.
- **Entregable:** `shared/components/ui/toaster.tsx` (sonner o similar); `onError` default en QueryClient que extrae mensaje y muestra toast.
- **Archivos:** `shared/components/ui/toaster.tsx`, provider.
- **Depends on:** F1.1, F1.3
- **Estimación:** M
- **Notas:**

---

# FASE 5 — Realtime infrastructure

**Goal:** Cambios de estado de pedido y ubicación de tienda propagan en <5s (PRD §7.2). Reconexión automática, offline awareness.
**Acceptance criteria:** Subscribirse a un canal, recibir evento, y ver la UI actualizada sin refresh en menos de 5 segundos end-to-end.

### Waves de F5

```
Wave 1 (serie):
└─ F5.1 Decisión de transporte (bloqueante DP-1)
      │
      ▼
Wave 2 (serie — un chat):
└─ F5.2 Realtime service abstraction
      │
      ▼
Wave 3 (paralelo, 2 chats):
├─ Chat α: F5.3 Integración con React Query ← toca shared/query/
└─ Chat β: F5.4 Reconnect + backoff          ← toca shared/services/realtime.ts
      │
      ▼
Wave 4 (al final — requiere features):
└─ F5.5 Test E2E propagación <5s (necesita F12 + F13 al menos parcialmente)
```

### F5.1 — Decisión de transporte
- **Estado:** 🔴 blocked (DP-1)
- **Por qué:** Supabase Realtime es el default, pero si se elige otro backend, cambia todo.
- **Entregable:** ADR `docs/adr/0002-realtime-transport.md`.
- **Depends on:** DP-1
- **Continues with:** F5.2 (cadena C-F5-realtime)
- **Estimación:** S
- **Notas:**

### F5.2 — Realtime service abstraction
- **Estado:** ⚪ pending
- **Por qué:** Interfaz para swapear transporte (Supabase Realtime / WebSocket propio / Pusher).
- **Entregable:** `shared/services/realtime.ts` con `RealtimeService` interface: `subscribe(channel, handler)`, `unsubscribe`, `status`.
- **Archivos:** `shared/services/realtime.ts`.
- **Depends on:** F5.1
- **Estimación:** M
- **Notas:**

### F5.3 — Integración con React Query
- **Estado:** ⚪ pending
- **Por qué:** Un evento realtime debe invalidar las queries relevantes. Sin esto, cada componente suscribe por su lado y es un caos.
- **Entregable:** `shared/query/useRealtimeInvalidation.ts` que conecta el event bus con `queryClient.invalidateQueries(queryKeys...)`.
- **Archivos:** `shared/query/useRealtimeInvalidation.ts`.
- **Depends on:** F5.2, F1.2
- **Estimación:** M
- **Notas:**

### F5.4 — Reconnect y backoff
- **Estado:** ⚪ pending
- **Por qué:** La conexión se cae; tiene que reconectarse sin intervención del usuario.
- **Entregable:** Lógica de reconnect con backoff exponencial, estado `connecting | online | offline`. Hook `useRealtimeStatus` para mostrar indicador de conexión en UI.
- **Archivos:** `shared/services/realtime.ts`, `shared/hooks/useRealtimeStatus.ts`.
- **Depends on:** F5.2
- **Estimación:** M
- **Notas:**

### F5.5 — Test E2E de propagación <5s
- **Estado:** ⚪ pending
- **Por qué:** SLA del PRD — hay que medirlo con un test automatizado.
- **Entregable:** Playwright test que abre 2 contextos (cliente + tienda), dispara una transición desde uno, y verifica actualización en el otro en <5s.
- **Archivos:** `e2e/realtime.spec.ts`.
- **Depends on:** F5.3, F12, F13
- **Estimación:** L
- **Notas:**

---

# FASE 6 — PWA completa

**Goal:** App instalable, funcional offline para funciones básicas, con push notifications.
**Acceptance criteria:** Lighthouse PWA score = 100. Push funciona en Android + iOS (con fallback documentado para iOS Safari).

### F6.1 — Serwist setup
- **Estado:** ⚪ pending
- **Por qué:** Service worker moderno para Next 15. El CLAUDE.md prohíbe `next-pwa` (abandonado).
- **Entregable:** `serwist` instalado, `app/sw.ts`, config en `next.config.mjs`.
- **Archivos:** `app/sw.ts`, `next.config.mjs`.
- **Depends on:** F0.8
- **Estimación:** M
- **Notas:**

### F6.2 — Estrategia de caché offline
- **Estado:** ⚪ pending
- **Por qué:** PRD §7.3 — "ver historial de pedidos" offline. Cacheo selectivo.
- **Entregable:** Estrategias por ruta: network-first para datos vivos, cache-first para assets, stale-while-revalidate para historial.
- **Archivos:** `app/sw.ts`.
- **Depends on:** F6.1
- **Estimación:** M
- **Notas:**

### F6.3 — Web Push notifications
- **Estado:** ⚪ pending
- **Por qué:** PRD §5.1 C8 / §5.2 T8 — alertas de cambio de estado.
- **Entregable:** `shared/services/push.ts` con `subscribe`, `unsubscribe`, `sendTestNotification`. VAPID keys en env. Flow de permisos.
- **Archivos:** `shared/services/push.ts`.
- **Depends on:** F6.1, F0.2
- **Estimación:** L
- **Notas:**

### F6.4 — Install prompt + guideline iOS
- **Estado:** ⚪ pending
- **Por qué:** iOS Safari: push solo funciona si la PWA está instalada (CLAUDE §9). Hay que guiar al usuario.
- **Entregable:** Componente `<InstallPrompt />` con detección de plataforma. Onboarding step que explica instalación en iOS.
- **Archivos:** `shared/components/InstallPrompt/*`.
- **Depends on:** F6.1
- **Estimación:** M
- **Notas:**

### F6.5 — Background sync
- **Estado:** ⚪ pending
- **Por qué:** Cliente envía pedido offline → se sincroniza cuando hay red.
- **Entregable:** Service worker con `sync` event; cola de mutations pendientes; integración con React Query mutations.
- **Archivos:** `app/sw.ts`, `shared/query/offline-queue.ts`.
- **Depends on:** F6.1, F4.2
- **Estimación:** L
- **Notas:**

---

# FASE 7 — Testing infrastructure completa

**Goal:** Cobertura mínima 80% (§CLAUDE testing). Tests como parte del flujo normal de desarrollo, no un afterthought.
**Acceptance criteria:** CI bloquea PRs con coverage <80% o tests fallando.

### F7.1 — Testing library setup completo
- **Estado:** ⚪ pending
- **Por qué:** F0.5 solo hizo el setup básico. Ahora sumar testing-library, jest-dom, user-event.
- **Entregable:** `vitest.setup.ts` con matchers de jest-dom. Helpers `renderWithProviders` en `shared/test-utils/`.
- **Archivos:** `vitest.setup.ts`, `shared/test-utils/*`.
- **Depends on:** F0.5, F1.1
- **Estimación:** M
- **Notas:**

### F7.2 — Test factories y fixtures
- **Estado:** ⚪ pending
- **Por qué:** Construir entidades de test manualmente genera duplicación y tests frágiles.
- **Entregable:** `shared/test-utils/factories.ts` con `createStore()`, `createUser()`, `createOrder()` usando los schemas Zod.
- **Archivos:** `shared/test-utils/factories.ts`.
- **Depends on:** F3.1, F7.1
- **Estimación:** M
- **Notas:**

### F7.3 — Tests de dominio (máquina de estados)
- **Estado:** ⚪ pending
- **Por qué:** Es la invariante más crítica del producto.
- **Entregable:** 100% coverage de `order-state-machine.ts` — todos los estados, todas las transiciones, todos los errores.
- **Archivos:** `shared/domain/order-state-machine.test.ts`.
- **Depends on:** F3.2, F7.1
- **Estimación:** M
- **Notas:**

### F7.4 — Tests de hooks críticos
- **Estado:** ⚪ pending
- **Por qué:** `useGeolocation`, `useSession`, `use*Query`.
- **Entregable:** Tests con mock de `navigator.geolocation`, react-query provider wrapper.
- **Archivos:** `shared/hooks/*.test.ts`.
- **Depends on:** F7.1
- **Estimación:** M
- **Notas:**

### F7.5 — Component tests (smart vs dumb)
- **Estado:** ⚪ pending
- **Por qué:** Dumb se testea con props; smart se testea con msw + providers.
- **Entregable:** Ejemplo de cada tipo: `MapScreen.test.tsx`, `MapScreen.container.test.tsx`.
- **Archivos:** tests correspondientes.
- **Depends on:** F7.1, F7.2
- **Estimación:** M
- **Notas:**

### F7.6 — Coverage en CI con umbral
- **Estado:** ⚪ pending
- **Por qué:** El número sin gate es decoración.
- **Entregable:** `vitest --coverage`, umbral 80% en `vitest.config.ts`, CI falla si baja.
- **Archivos:** `vitest.config.ts`, `.github/workflows/ci.yml`.
- **Depends on:** F0.7, F7.1
- **Estimación:** S
- **Notas:**

### F7.7 — Visual regression (opcional MVP)
- **Estado:** ⏸️ deferred
- **Por qué:** Chromatic/Percy son caros; dejar para post-MVP salvo que se use Storybook.
- **Depends on:** F9
- **Estimación:** M
- **Notas:**

---

# FASE 8 — Observability

**Goal:** Ver qué pasa en producción, medir KPIs del §8 del PRD, alertar en incidentes.
**Acceptance criteria:** Cada error de prod tiene trace; cada KPI del PRD tiene dashboard; hay alertas accionables.

### F8.1 — Sentry (errors + performance)
- **Estado:** 🔴 blocked (DP-3)
- **Por qué:** Standard de error tracking.
- **Entregable:** `@sentry/nextjs` instalado, DSN en env, `shared/utils/logger.ts` envía `error` a Sentry en prod.
- **Archivos:** `sentry.client.config.ts`, `sentry.server.config.ts`, logger.
- **Depends on:** DP-3, F0.2, F1.3
- **Estimación:** M
- **Notas:**

### F8.2 — Analytics de producto (eventos)
- **Estado:** 🔴 blocked (DP-3)
- **Por qué:** PostHog / Vercel Analytics. Eventos del dominio (pedido enviado, aceptado, finalizado...).
- **Entregable:** `shared/services/analytics.ts` con `track(event, props)`. Eventos tipados con zod. Integrado en transiciones de estado.
- **Archivos:** `shared/services/analytics.ts`, `shared/constants/analytics-events.ts`.
- **Depends on:** DP-3, F3.2
- **Estimación:** M
- **Notas:**

### F8.3 — KPI instrumentation
- **Estado:** ⚪ pending
- **Por qué:** El §8 del PRD tiene 6 KPIs — cada uno debe tener su métrica.
- **Entregable:** Eventos tipados para `order_sent`, `order_accepted`, `order_rejected`, `order_expired`, `order_finalized`, timings entre estados. Dashboard template documentado.
- **Archivos:** `shared/services/kpi.ts`, `docs/kpi-dashboard.md`.
- **Depends on:** F8.2
- **Estimación:** M
- **Notas:**

### F8.4 — Feature flags
- **Estado:** 🔴 blocked (DP-4)
- **Por qué:** Rollouts graduales, kill switches, A/B tests.
- **Entregable:** `shared/services/flags.ts` + hook `useFlag(key)`. Integración con provider elegido.
- **Archivos:** `shared/services/flags.ts`, `shared/hooks/useFlag.ts`.
- **Depends on:** DP-4
- **Estimación:** M
- **Notas:**

### F8.5 — Structured logging server-side
- **Estado:** ⚪ pending
- **Por qué:** Logs de Route Handlers y Server Actions deben ser queryables.
- **Entregable:** `pino` o equivalente; formato JSON; request-id correlativo.
- **Archivos:** `shared/utils/server-logger.ts`.
- **Depends on:** F1.3
- **Estimación:** S
- **Notas:**

---

# FASE 9 — Design system

**Goal:** Sistema de diseño con tokens, primitivas, componentes y documentación — no solo Tailwind ad-hoc.
**Acceptance criteria:** Cualquier componente nuevo usa tokens y primitivas. No hay valores arbitrarios (`h-[45vh]`) excepto casos justificados.

### F9.1 — Escala de spacing en Tailwind
- **Estado:** ⚪ pending
- **Por qué:** Hoy `h-[45vh]`, `w-[440px]`, `text-[11px]` — cada componente elige un número distinto.
- **Entregable:** `tailwind.config.ts` con `spacing`, `height`, `width`, `fontSize` extendidos desde `tokens.ts`. Reemplazar TODOS los arbitrary values en features/.
- **Archivos:** `tailwind.config.ts`, grep de arbitraries.
- **Depends on:** F1.8
- **Estimación:** L
- **Notas:**

### F9.2 — Tipografía sistematizada
- **Estado:** ⚪ pending
- **Por qué:** Sin escala, terminamos con 14 variantes inconsistentes.
- **Entregable:** Componente `<Text variant="display-xl" | "heading-lg" | "body" | "caption" ... />` tipado. Todos los `h1/h2/p` existentes migran.
- **Archivos:** `shared/components/typography/Text.tsx`.
- **Depends on:** F1.8
- **Estimación:** M
- **Notas:**

### F9.3 — Icon system
- **Estado:** ⚪ pending
- **Por qué:** `lucide-react` cada import es un bundle-cost. Wrapper con lazy + size tokens.
- **Entregable:** `shared/components/Icon/Icon.tsx` con props `name`, `size` (token), `color` (token).
- **Archivos:** `shared/components/Icon/*`.
- **Depends on:** F1.8
- **Estimación:** M
- **Notas:**

### F9.4 — Motion primitives
- **Estado:** ⚪ pending
- **Por qué:** Durations y easings consistentes. Hoy cada componente reinventa (`duration-300 ease-out`, `ease-[cubic-bezier(...)]`).
- **Entregable:** `shared/styles/motion.ts` con `durations`, `easings`, helpers para framer-motion.
- **Archivos:** `shared/styles/motion.ts`.
- **Depends on:** F1.8
- **Estimación:** S
- **Notas:**

### F9.5 — Storybook (opcional)
- **Estado:** ⏸️ deferred
- **Por qué:** Alto costo de mantenimiento; evaluar cuando haya ≥20 componentes reutilizables.
- **Depends on:** —
- **Estimación:** L
- **Notas:**

### F9.6 — Dark mode audit
- **Estado:** ⚪ pending
- **Por qué:** Dark mode existe pero sin test visual.
- **Entregable:** Checklist de pantallas verificadas. Test Playwright con `prefers-color-scheme`.
- **Archivos:** `e2e/dark-mode.spec.ts`.
- **Depends on:** F0.6
- **Estimación:** M
- **Notas:**

### F9.7 — Contrast audit (a11y)
- **Estado:** ⚪ pending
- **Por qué:** WCAG AA mínimo.
- **Entregable:** Reporte con contrastes calculados por token combination. Fix de los que fallen.
- **Archivos:** doc + fixes en tokens.
- **Depends on:** F1.8
- **Estimación:** M
- **Notas:**

---

# FASE 10 — i18n + a11y

**Goal:** Soporte multi-idioma y accesibilidad WCAG AA.
**Acceptance criteria:** Toda la copy vive en `messages/*.json`. Axe no reporta violations críticas.

### F10.1 — next-intl setup
- **Estado:** 🔴 blocked (DP-7)
- **Por qué:** Si es solo AR, es opcional; si es multi-país, es urgente.
- **Entregable:** `next-intl` instalado, `messages/es.json`, locale routing opcional.
- **Archivos:** `messages/*`, `i18n.ts`.
- **Depends on:** DP-7
- **Estimación:** L
- **Notas:**

### F10.2 — Migrar copy a messages
- **Estado:** ⚪ pending
- **Por qué:** Hoy todo está hardcoded.
- **Entregable:** 100% de los strings de UI en `messages/es.json`. Eslint rule que detecta strings hardcoded en JSX.
- **Archivos:** `messages/es.json`, features todas.
- **Depends on:** F10.1
- **Estimación:** L
- **Notas:**

### F10.3 — ARIA audit
- **Estado:** ⚪ pending
- **Por qué:** Cumplimiento WCAG AA.
- **Entregable:** `axe-playwright` en E2E suite. 0 violations críticas en landing y map.
- **Archivos:** `e2e/a11y.spec.ts`.
- **Depends on:** F0.6
- **Estimación:** M
- **Notas:**

### F10.4 — Keyboard navigation
- **Estado:** ⚪ pending
- **Por qué:** Todos los flujos deben ser navegables sin mouse.
- **Entregable:** Focus management en bottom sheets, modals, nav. Test E2E.
- **Archivos:** tests + fixes puntuales.
- **Depends on:** F10.3
- **Estimación:** M
- **Notas:**

---

# FASE 11 — Mapa real

**Goal:** Reemplazar `MapCanvas` placeholder con react-map-gl + MapLibre + tiles reales.
**Acceptance criteria:** Mapa real con pins dinámicos, pan/zoom fluido en mobile, clustering con densidad alta.

### F11.1 — Decisión de tile provider
- **Estado:** 🔴 blocked (DP-5)
- **Depends on:** DP-5
- **Estimación:** S
- **Notas:**

### F11.2 — Instalar react-map-gl + MapLibre
- **Estado:** ⚪ pending
- **Entregable:** Paquetes, estilo base, API keys en env.
- **Archivos:** `package.json`, `.env.example`.
- **Depends on:** F11.1, F0.2
- **Estimación:** S
- **Notas:**

### F11.3 — Reemplazar MapCanvas placeholder
- **Estado:** ⚪ pending
- **Entregable:** Mismo contrato de props, implementación real con `<Map>` de react-map-gl. Pins con coords reales.
- **Archivos:** `features/map/components/MapCanvas.tsx`.
- **Depends on:** F11.2
- **Estimación:** L
- **Notas:**

### F11.4 — Clustering
- **Estado:** ⚪ pending
- **Por qué:** Con 50+ tiendas en pantalla, pins sueltos no escalan.
- **Entregable:** `supercluster` integrado; clusters al zoom-out, pins individuales al zoom-in.
- **Archivos:** `features/map/hooks/useClusters.ts`.
- **Depends on:** F11.3
- **Estimación:** M
- **Notas:**

### F11.5 — User location tracking
- **Estado:** ⚪ pending
- **Por qué:** Seguir al usuario mientras se mueve.
- **Entregable:** `navigator.geolocation.watchPosition` detrás de `useGeolocation` extendido; pin del usuario actualiza en vivo.
- **Archivos:** `shared/hooks/useGeolocation.ts`.
- **Depends on:** F11.3
- **Estimación:** M
- **Notas:**

### F11.6 — Performance
- **Estado:** ⚪ pending
- **Por qué:** Mapa + 100 pins en mobile medio = objetivo 60fps.
- **Entregable:** Pins como símbolos vectoriales, no React components. Lighthouse mobile: perf >90 en `/map`.
- **Depends on:** F11.4
- **Estimación:** M
- **Notas:**

---

# FASE 12 — Features: Cliente (pedidos)

**Goal:** Flow completo del cliente — desde ver mapa hasta `FINALIZADO`.
**Acceptance criteria:** Un cliente puede encontrar una tienda, enviar pedido, seguirlo en vivo y ver la transición a `FINALIZADO`.

### ⚡ F12 / F13 / F14 son las trillizas paralelas

**Este es el momento de máximo paralelismo del proyecto.** Una vez que F2, F3, F4, F5 estén ✅, estas tres fases se ejecutan **simultáneamente en 3 chats dedicados** (uno por rol):

```
      [F2 ✅] + [F3 ✅] + [F4 ✅] + [F5 ✅]
                        │
     ┌──────────────────┼──────────────────┐
     ▼                  ▼                  ▼
  Chat CLIENTE       Chat TIENDA        Chat ADMIN
  (F12)              (F13)              (F14)
  features/map/      features/store-*   features/admin-*
  features/orders/   features/store-    app/(admin)/*
  app/(client)/*     dashboard/
                     app/(store)/*
```

**No chocan** porque cada uno toca archivos exclusivos de su rol. Solo leen `shared/` (tipos, services, hooks), no lo modifican.

### Waves dentro de F12

```
Wave 1 (serie — un solo chat):
└─ F12.1 Store detail bottom sheet (es la entrada al flow)
      │
      ▼
Wave 2 (paralelo, 2 sub-chats si se quiere):
├─ F12.2 Cart client state   ← shared/stores/cart.ts
└─ F12.7 Profile + preferences ← app/(client)/profile/*
      │
      ▼
Wave 3 (serie — el flow principal):
└─ F12.3 Submit order
      │
      ▼
   F12.4 Order tracking screen  ← es la pantalla crítica, necesita F12.3
      │
      ▼
Wave 4 (paralelo, 2 sub-chats):
├─ F12.5 Order history
└─ F12.6 Cancel flow
```

### F12.1 — Store detail bottom sheet
- **Estado:** ⚪ pending
- **Por qué:** Parte del flow desde el mapa.
- **Entregable:** Bottom sheet con foto, descripción, catálogo, horarios. No es ruta aparte (decisión arquitectónica — ver análisis previo).
- **Archivos:** `features/map/components/StoreDetailSheet/*`.
- **Depends on:** F2.5, F3.1, F4.1
- **Estimación:** L
- **Notas:**

### F12.2 — Product selection + cart client state
- **Estado:** ⚪ pending
- **Entregable:** Cart en Zustand, persistido por tienda activa, validación con zod.
- **Archivos:** `shared/stores/cart.ts`, componente.
- **Depends on:** F1.6, F3.1
- **Estimación:** M
- **Notas:**

### F12.3 — Submit order
- **Estado:** ⚪ pending
- **Entregable:** Mutation con optimistic update; transición a `ENVIADO`. Snapshot de productos.
- **Archivos:** `features/orders/hooks/useSendOrderMutation.ts`.
- **Depends on:** F3.2, F3.3, F4.2
- **Continues with:** F12.4 (cadena C-F12-order)
- **Estimación:** M
- **Notas:**

### F12.4 — Order tracking screen
- **Estado:** ⚪ pending
- **Por qué:** La pantalla más crítica del flow (§5.1 C6).
- **Entregable:** `/orders/[id]` con realtime subscription al pedido, timeline de estados, CTA por estado.
- **Archivos:** `app/(client)/orders/[id]/page.tsx`, feature.
- **Depends on:** F5.3, F12.3
- **Estimación:** L
- **Notas:**

### F12.5 — Order history
- **Estado:** ⚪ pending
- **Entregable:** `/orders` listado paginado; filtros por estado.
- **Archivos:** `app/(client)/orders/page.tsx`, feature.
- **Depends on:** F4.1
- **Estimación:** M
- **Notas:**

### F12.6 — Cancel flow
- **Estado:** ⚪ pending
- **Entregable:** Cliente puede cancelar en estados permitidos (§6.1). Confirmación.
- **Depends on:** F3.2, F4.2
- **Estimación:** S
- **Notas:**

### F12.7 — Profile + preferences
- **Estado:** ⚪ pending
- **Entregable:** `/profile` con datos, permisos de ubicación, notificaciones.
- **Depends on:** F2.3
- **Estimación:** M
- **Notas:**

---

# FASE 13 — Features: Tienda

**Goal:** Dashboard operativo — flow completo desde la perspectiva del vendedor.
**Acceptance criteria:** Una tienda puede activar disponibilidad, recibir pedido, aceptarlo y marcarlo finalizado, viendo el cambio del cliente en tiempo real.

> **Paralelismo:** F13 corre **en paralelo total con F12 y F14** (ver nota en F12). Dentro de F13 también hay sub-paralelismo.

### Waves dentro de F13

```
Wave 1 (serie — un chat):
└─ F13.1 Dashboard home (shell base)
      │
      ▼
Wave 2 (paralelo, 3 sub-chats si se quiere acelerar):
├─ Chat α: F13.2 Availability toggle + location publishing
├─ Chat β: F13.3 Catálogo CRUD       ← archivos aislados
└─ Chat γ: F13.6 Store profile       ← archivos aislados
      │
      ▼
Wave 3 (serie después de F13.1):
└─ F13.4 Incoming orders inbox
      │
      ▼
Wave 4 (serie — depende del inbox):
└─ F13.5 Accept/reject/finalize flow
      │
      ▼
Wave 5 (último):
└─ F13.7 Analytics básico (requiere F8.3)
```

### F13.1 — Dashboard home
- **Estado:** ⚪ pending
- **Entregable:** `/store` con availability toggle, lista de pedidos entrantes, accesos directos.
- **Archivos:** `app/(store)/page.tsx`, feature.
- **Depends on:** F2.6, F4.1, F5.3
- **Estimación:** L
- **Notas:**

### F13.2 — Availability toggle con location publishing
- **Estado:** ⚪ pending
- **Por qué:** Al activar, arranca el reporting de ubicación cada 30-60s (PRD §7.1).
- **Entregable:** Toggle, intervalo de publicación, estado "ubicación desactualizada".
- **Archivos:** `features/store-dashboard/hooks/useLocationPublishing.ts`.
- **Depends on:** F3.4, shared/constants/geo.ts
- **Estimación:** M
- **Notas:**

### F13.3 — Catálogo CRUD
- **Estado:** ⚪ pending
- **Entregable:** `/store/catalog` lista; `/store/catalog/new`; `/store/catalog/[id]/edit`. Upload de foto.
- **Depends on:** F4.1, F4.2
- **Estimación:** L
- **Notas:**

### F13.4 — Incoming orders inbox
- **Estado:** ⚪ pending
- **Entregable:** Vista realtime con nuevos pedidos, sort por tiempo, sound/vibration opcional.
- **Depends on:** F5.3
- **Estimación:** M
- **Notas:**

### F13.5 — Accept/reject/finalize flow
- **Estado:** ⚪ pending
- **Entregable:** Actions disparadas con mutations, state machine enforcement.
- **Depends on:** F3.2, F4.2
- **Estimación:** M
- **Notas:**

### F13.6 — Store profile management
- **Estado:** ⚪ pending
- **Entregable:** `/store/profile` — datos, zona, horarios base.
- **Depends on:** F4.2
- **Estimación:** M
- **Notas:**

### F13.7 — Analytics básico
- **Estado:** ⚪ pending
- **Entregable:** `/store/analytics` con los KPIs del PRD §8 filtrados para esa tienda.
- **Depends on:** F8.3
- **Estimación:** M
- **Notas:**

---

# FASE 14 — Features: Admin

**Goal:** Panel de moderación y métricas del producto.
**Acceptance criteria:** Admin puede validar tiendas nuevas, moderar contenido y ver KPIs globales.

> **Paralelismo:** F14 corre **en paralelo total con F12 y F13**. Dentro de F14, casi todas las tareas son independientes entre sí.

### Waves dentro de F14

```
Wave 1 (paralelo, 5 sub-chats posibles — es la fase más paralelizable internamente):
├─ F14.1 Dashboard KPIs       ← depende de F8.3
├─ F14.2 Store validation     ← archivos aislados
├─ F14.3 Content moderation   ← archivos aislados
├─ F14.4 Order audit log      ← archivos aislados
└─ F14.5 User management      ← archivos aislados
```

**Por qué todo en paralelo:** cada sección del admin es una ruta independiente (`/admin/stores`, `/admin/moderation`, `/admin/orders`, `/admin/users`) sin estado compartido entre ellas. Si hay recursos (equipo o chats), F14 se puede terminar en una fracción del tiempo serial.

### F14.1 — Dashboard KPIs
- **Estado:** ⚪ pending
- **Entregable:** `/admin` con los 6 KPIs del §8.
- **Depends on:** F8.3
- **Estimación:** M
- **Notas:**

### F14.2 — Store validation queue
- **Estado:** ⚪ pending
- **Entregable:** `/admin/stores` con filtro `pending`, detalle, approve/reject.
- **Depends on:** F2.9, F4.2
- **Estimación:** M
- **Notas:**

### F14.3 — Content moderation
- **Estado:** ⚪ pending
- **Entregable:** Cola de reportes, acción de remover contenido.
- **Depends on:** F4.2
- **Estimación:** M
- **Notas:**

### F14.4 — Order audit log
- **Estado:** ⚪ pending
- **Entregable:** Búsqueda por id de pedido; timeline completo de transiciones con timestamps y actor.
- **Depends on:** F3.2
- **Estimación:** M
- **Notas:**

### F14.5 — User management
- **Estado:** ⚪ pending
- **Entregable:** Suspender cliente o tienda. Consecuencias del §9.5 del PRD.
- **Depends on:** F2.3
- **Estimación:** M
- **Notas:**

---

# FASE 15 — Performance y escalabilidad

**Goal:** Preparar la app para cargas altas: bundle liviano, caché eficiente, queries optimizadas.
**Acceptance criteria:** Lighthouse mobile >90 en performance. Time-to-interactive <3s en conexión 4G.

### F15.1 — Bundle analysis
- **Estado:** ⚪ pending
- **Entregable:** `@next/bundle-analyzer` en CI, reporte en PRs grandes, umbral por chunk.
- **Depends on:** F0.7
- **Estimación:** S
- **Notas:**

### F15.2 — RSC boundaries review
- **Estado:** ⚪ pending
- **Por qué:** Hoy casi todo es `"use client"`. Revisar qué puede ser Server Component.
- **Entregable:** Auditoría route-por-route, mover data fetching a server cuando se pueda.
- **Depends on:** F4.*
- **Estimación:** L
- **Notas:**

### F15.3 — Image optimization
- **Estado:** ⚪ pending
- **Entregable:** Todas las `<img>` migradas a `next/image`. Remote patterns en `next.config.mjs`.
- **Depends on:** —
- **Estimación:** M
- **Notas:**

### F15.4 — Edge caching strategy
- **Estado:** ⚪ pending
- **Entregable:** Rutas estáticas con ISR; APIs con cache headers correctos; Vercel Edge Config para flags.
- **Depends on:** F8.4
- **Estimación:** L
- **Notas:**

### F15.5 — Database query optimization
- **Estado:** ⚪ pending
- **Por qué:** Cuando entre Supabase real, queries mal indexadas matan el servicio.
- **Entregable:** Índices documentados por query. `EXPLAIN` de las hot queries. PostGIS para geoqueries.
- **Depends on:** DP-1
- **Estimación:** L
- **Notas:**

### F15.6 — Load testing
- **Estado:** ⚪ pending
- **Entregable:** k6 o Artillery con escenarios del §8. Baseline y goals documentados.
- **Depends on:** F15.5
- **Estimación:** L
- **Notas:**

---

# FASE 16 — Seguridad y compliance

**Goal:** OWASP Top 10 cubiertos, privacidad respetada, preparado para GDPR/LGPD.
**Acceptance criteria:** Security audit con 0 críticos. Política de privacidad publicada. Rate limiting activo.

### F16.1 — Rate limiting
- **Estado:** ⚪ pending
- **Entregable:** Upstash/Vercel KV para rate limit. Reglas por endpoint. PRD §9.5 — evitar pedidos falsos.
- **Depends on:** —
- **Estimación:** M
- **Notas:**

### F16.2 — Audit log inmutable
- **Estado:** ⚪ pending
- **Por qué:** Transiciones de pedido deben quedar registradas con actor + timestamp (PRD §6.2).
- **Entregable:** Tabla append-only en backend; integración con state machine.
- **Depends on:** F3.2, DP-1
- **Estimación:** M
- **Notas:**

### F16.3 — Privacy policy + terms
- **Estado:** ⚪ pending
- **Entregable:** `/legal/privacy`, `/legal/terms`. Cookie consent si DP-7 incluye UE.
- **Depends on:** DP-7
- **Estimación:** M
- **Notas:**

### F16.4 — Privacidad de ubicación del cliente
- **Estado:** ⚪ pending
- **Por qué:** PRD §9.4 — ubicación del cliente NUNCA se expone a la tienda antes de `ACEPTADO`. Invariante crítico.
- **Entregable:** Test automático que intenta leer coords pre-accept desde contexto de tienda y espera `forbidden`.
- **Depends on:** F12.4, F13.4
- **Estimación:** M
- **Notas:**

### F16.5 — Secret rotation process
- **Estado:** ⚪ pending
- **Entregable:** Runbook en `docs/runbooks/secret-rotation.md`.
- **Depends on:** —
- **Estimación:** S
- **Notas:**

### F16.6 — Security audit externo o Snyk/Dependabot
- **Estado:** ⚪ pending
- **Entregable:** Dependabot activado; `pnpm audit` en CI.
- **Depends on:** F0.7
- **Estimación:** S
- **Notas:**

### F16.7 — GDPR/LGPD readiness
- **Estado:** 🔴 blocked (DP-7)
- **Entregable:** Export de datos del usuario; delete-my-account; anonimización al borrar.
- **Depends on:** DP-7, F2.3
- **Estimación:** L
- **Notas:**

---

# FASE 17 — DevEx y documentación

**Goal:** Bajar el costo de onboarding de nuevos devs. Decisiones arquitectónicas trazables.
**Acceptance criteria:** Un dev nuevo puede levantar el proyecto y hacer su primer PR en <1 día.

### F17.1 — Contributing guide
- **Estado:** ⚪ pending
- **Entregable:** `CONTRIBUTING.md` con setup, flow, convenciones.
- **Depends on:** F0.*
- **Estimación:** S
- **Notas:**

### F17.2 — ADRs (Architecture Decision Records)
- **Estado:** ⚪ pending
- **Entregable:** `docs/adr/` con template. Primeros ADRs: estructura features/shared, auth provider, realtime transport.
- **Depends on:** —
- **Estimación:** M
- **Notas:**

### F17.3 — Onboarding doc
- **Estado:** ⚪ pending
- **Entregable:** `docs/ONBOARDING.md` — setup paso a paso, diagrama de arquitectura, glosario.
- **Depends on:** F0.*
- **Estimación:** M
- **Notas:**

### F17.4 — Changelog automatizado
- **Estado:** ⚪ pending
- **Entregable:** `changesets` o `release-please` con conventional commits.
- **Depends on:** F0.4
- **Estimación:** S
- **Notas:**

### F17.5 — Monorepo evaluation
- **Estado:** 🔴 blocked (DP-8)
- **Entregable:** Si DP-8 = sí, migrar a Turborepo con `apps/web` + `packages/*`.
- **Depends on:** DP-8
- **Estimación:** XL
- **Notas:**

---

# FASE 18 — Producción

**Goal:** App en producción con monitoring, alertas, runbooks.
**Acceptance criteria:** Deploy automatizado a staging y prod. Alertas en Slack. Runbooks para incidentes comunes.

### F18.1 — Multi-environment config
- **Estado:** ⚪ pending
- **Entregable:** dev / staging / prod en Vercel. Env vars separadas. Branch → env mapping.
- **Depends on:** F0.2
- **Estimación:** M
- **Notas:**

### F18.2 — Vercel deployment config
- **Estado:** ⚪ pending
- **Entregable:** `vercel.json` con regions, headers, redirects. Preview deployments por PR.
- **Depends on:** F0.7
- **Estimación:** S
- **Notas:**

### F18.3 — Monitoring dashboards
- **Estado:** ⚪ pending
- **Entregable:** Dashboards en el provider elegido (DP-3) con latencia, error rate, KPIs.
- **Depends on:** F8.3
- **Estimación:** M
- **Notas:**

### F18.4 — Alerting rules
- **Estado:** ⚪ pending
- **Entregable:** Alertas Slack/email para: error rate >1%, latencia >2s, realtime offline >1m.
- **Depends on:** F18.3
- **Estimación:** M
- **Notas:**

### F18.5 — Runbooks de incidentes
- **Estado:** ⚪ pending
- **Entregable:** `docs/runbooks/*.md` para: deploy rollback, Supabase down, push notifications caídas, rate limit triggered.
- **Depends on:** —
- **Estimación:** M
- **Notas:**

### F18.6 — Disaster recovery
- **Estado:** ⚪ pending
- **Entregable:** Backups documentados; RPO/RTO definidos; test de restore trimestral.
- **Depends on:** DP-1
- **Estimación:** L
- **Notas:**

---

## Resumen ejecutivo

| Fase | Goal | Bloqueo | Tareas | Esfuerzo estimado |
|---|---|---|---|---|
| F0 | Dev infrastructure | — | 9 | 1-2 semanas |
| F1 | Capas transversales | F0 | 10 | 1-2 semanas |
| F2 | Auth + roles | F1, DP-2 | 9 | 2 semanas |
| F3 | Domain model | F0 | 7 | 1-2 semanas |
| F4 | Data layer | F1, F3 | 5 | 1 semana |
| F5 | Realtime | F2, F3, DP-1 | 5 | 1-2 semanas |
| F6 | PWA | F1 | 5 | 2 semanas |
| F7 | Testing | F1 | 7 | 1-2 semanas |
| F8 | Observability | DP-3, DP-4 | 5 | 1-2 semanas |
| F9 | Design system | F1 | 7 | 2 semanas |
| F10 | i18n + a11y | DP-7 | 4 | 1-2 semanas |
| F11 | Mapa real | DP-5 | 6 | 1-2 semanas |
| F12 | Feature: Cliente | F2-F5 | 7 | 2-3 semanas |
| F13 | Feature: Tienda | F2-F5 | 7 | 2-3 semanas |
| F14 | Feature: Admin | F2-F5 | 5 | 1-2 semanas |
| F15 | Performance | F4 | 6 | 2 semanas |
| F16 | Security | F2, F3 | 7 | 2 semanas |
| F17 | DevEx + docs | F0 | 5 | 1 semana |
| F18 | Producción | F8, F16 | 6 | 1-2 semanas |

**Total:** ~130 tareas, 30-40 semanas single-dev / ~10-15 con trabajo paralelo disciplinado.

---

## Changelog de este documento

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-04-15 | Creación del epic con 18 fases y ~130 tareas | migración Opción A |
| 2026-04-15 | Agregada sección "Cómo leer dependencias y paralelismo" con ejemplos concretos (login serie, mapa+dashboard paralelo) | — |
| 2026-04-15 | Waves de paralelismo intra-fase en F0, F1, F2, F3, F4, F5, F12, F13, F14 | — |
| 2026-04-15 | Tabla de máximo teórico de chats concurrentes por etapa | — |
| 2026-04-15 | Agregadas cadenas de auto-continuación (`Continues with:`) para 10 cadenas / 17 tareas | — |
