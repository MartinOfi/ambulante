# Prompt template para agentes paralelos — Backend

> **Cómo usar:** copiá el bloque de abajo, reemplazá `{{TASK_IDS}}` con la(s) tarea(s) del [EPIC-BACKEND](./EPIC-BACKEND.md) que querés ejecutar, y pegalo como primer mensaje en un chat nuevo de Claude Code.
>
> **Diferencia con `PROMPT-TEMPLATE.md` (frontend):** este template fuerza la lectura de la skill `.claude/skills/supabase-postgres-best-practices/` como paso obligatorio antes de escribir SQL, policies, índices o migraciones. Las tareas del epic backend listan rules específicas en su campo `Skill rules aplicables:`.
>
> **Para paralelizar:** ver `docs/PARALLEL-EXECUTION-BACKEND.md`.
>
> **Referencia de tareas:** `docs/EPIC-BACKEND.md`.

---

## Guía rápida de llenado

| Situación | Qué poner en `{{TASK_IDS}}` |
|---|---|
| Una sola tarea | `B0.1` |
| Cabeza de cadena | `B1.1` — el agente lee `Continues with:` y sigue solo |
| Tareas sueltas seriales (sin cadena en el epic) | `B5.3, B5.4` |
| Trilliza de swap | **NO** — cada trilliza (B9, B10, B11) tiene varios chats paralelos; no las metas todas en un chat |

**Cadenas definidas en el epic backend:**
- `B1.1` → B1.2 → B1.3 → B1.4 → B1.5 (C-B1-schema)
- `B4.1` → B4.2 → B4.3 → B4.4 (C-B4-auth)
- `B6.1` → B6.2 → B6.3 → B6.4 (C-B6-realtime)
- `B7.1` → B7.2 → B7.3 (C-B7-cron)
- `B8.1` → B8.2 → B8.3 (C-B8-push)

---

## TEMPLATE — copiar desde acá

```
# Rol
Sos un agente senior ejecutando tareas del BACKEND del proyecto Ambulante (PWA de
tiendas ambulantes con Next.js 15, TypeScript strict, Tailwind v4, Supabase).
Trabajás en paralelo con otros chats. Tu responsabilidad es entregar código
correcto, testeado y auditado — no velocidad a costa de calidad.

Tu scope ES backend: schema SQL, RLS policies, migraciones, Server Actions,
Route Handlers, realtime, storage, cron, push. Consumís las interfaces y tipos
del dominio ya existentes en `shared/domain/` y `shared/repositories/`.

# Tarea asignada
Task IDs a ejecutar: {{TASK_IDS}}

---
## PASO 0 · Setup del worktree (OBLIGATORIO — antes de cualquier otra acción)

AUTO-CHECK — ejecutá esto PRIMERO:

  git branch --show-current

- feat/b... → ya estás en tu worktree. Saltá a "Lectura obligatoria".
- main     → estás en el principal. NO podés hacer nada todavía. Seguí los pasos abajo.
- Otro     → STOP. Reportá al usuario antes de continuar.

Regla absoluta: TODO el trabajo ocurre DESDE el worktree. Si branch --show-current da
main mientras trabajás → pararse.

Crear el worktree:

  1. Verificá el principal limpio:
       git branch --show-current    # debe ser "main"
       git status --short           # debe estar vacío
     Si no → STOP, reportá.

  2. Elegí nombre y branch con tu Task ID:
       Worktree dir: ../ambulante-b<task-id-con-guiones>
       Branch:       feat/b<task-id-con-guiones>-<slug-corto>

  3. Creá: git worktree add ../ambulante-b<task-id> -b feat/b<task-id>-<slug>

  4. Movete: cd ../ambulante-b<task-id>

  5. Verificá aislamiento (los 4 deben dar lo esperado):
       pwd                        # tu worktree dir
       git branch --show-current  # tu branch nueva
       git status --short         # vacío
       git worktree list          # principal + tuyo (mínimo 2)

  6. Instalá dependencias (node_modules/ no se comparte entre worktrees):
       pnpm install

  7. Levantá Supabase local (CADA worktree necesita su propia instancia para no chocar
     en puertos 54321-54324). Si es tu PRIMER chat del epic y B0.1 todavía no cerró,
     sos vos quien la está creando — seguí esa tarea en vez de este paso.
     Si B0.1 ✅:
       pnpm supabase:start
     Verificá que arranque sin errores. Los puertos quedan reservados para este worktree.
     Cuando termines la tarea (cleanup en PASO 9), hacé pnpm supabase:stop.

Reglas durante la ejecución:
- Nunca cd al principal. Usá git -C /Users/martinoficialdegui/Desktop/ambulante <cmd>.
- Paths absolutos siempre en Read/Edit/Write.
- Cleanup al terminar la cadena: lo gestiona el PASO 9.

---
## Lectura obligatoria (en este orden, ANTES de planear nada)

Usá Read tool, no memoria. Este orden está diseñado para construir contexto de
abajo hacia arriba: reglas de código → reglas de producto → reglas de SQL → epic.

1. /Users/martinoficialdegui/Desktop/ambulante/CLAUDE.md — completo.
   Atención especial a §4 (arquitectura), §5 (REGISTRY), §6 (reglas), §7 (invariantes),
   §10 (backend — NUEVO).

2. /Users/martinoficialdegui/Desktop/ambulante/docs/PRD.md — §6 (máquina de estados),
   §7 (consideraciones técnicas), §9 (edge cases). Otras secciones según tu tarea.

3. /Users/martinoficialdegui/Desktop/ambulante/docs/EPIC-BACKEND.md:
   - "Cómo usar este documento" y "Cómo leer dependencias"
   - Sección "Convenciones" completa (snake_case, PKs, FKs con índice, RLS con
     (select auth.uid()), SKIP LOCKED, transacciones cortas)
   - Sección "Reglas de portabilidad" (directorios permitidos para @supabase/*,
     facades, migration playbook)
   - Bloque de cada tarea asignada con su fase completa.

4. /Users/martinoficialdegui/Desktop/ambulante/.claude/skills/supabase-postgres-best-practices/SKILL.md
   — la intro de la skill. Luego las rules específicas listadas en el campo
   "Skill rules aplicables:" de cada tarea:
     .claude/skills/supabase-postgres-best-practices/references/<rule>.md

   REGLA DURA: no se escribe SQL, RLS, migraciones ni índices sin haber leído las
   rules aplicables. Si tu tarea no lista skill rules y no toca SQL, igual ojeá
   rapidito el SKILL.md para saber qué ofrece.

5. /Users/martinoficialdegui/Desktop/ambulante/shared/REGISTRY.md — índice rápido.
   Luego SOLO el detail file relevante a tu tarea según `REGISTRY:` del bloque:
     ui.md / data.md / domain.md / infra.md / features.md / testing.md

---
## Protocolo de CLAIM (antes del plan)

1. Abrí docs/EPIC-BACKEND.md.
2. Para cada ID en {{TASK_IDS}}:
   - 🟢 ready       → editá Estado a: 🟡 in-progress [owner: chat-<fecha>, started: <hora>]
   - 🟡 in-progress → STOP. Otro chat la tomó. Reportá y esperá instrucciones.
3. Commit inmediato: chore(epic-backend): claim {{TASK_IDS}}
4. Imprimí en el chat: "Claim confirmado: {{TASK_IDS}}"

---
## PASO 1 · Entender

Imprimí en el chat:
- Qué pide la tarea (1 párrafo max).
- Qué archivos vas a crear/modificar (paths absolutos).
- Qué vas a consumir de shared/ (verificado contra REGISTRY).
- Qué skill rules aplican y qué dicen (resumen de 1 línea por rule).
- Qué invariantes del PRD/CLAUDE.md aplican (ej: "PRD §7.2 privacy de ubicación,
  §7.6 timeouts").
- Qué invariantes del EPIC-BACKEND aplican (ej: "regla 4: (select auth.uid()) en
  policies; regla 6: SKIP LOCKED en cron").

---
## PASO 2 · Plan inicial

Plan numerado con pasos concretos: archivos, migraciones, tests, tablas tocadas,
policies, índices. Sin pseudocódigo vago. Cada paso verificable.

Si tu tarea crea o modifica SQL: incluí en el plan un snippet SQL esqueleto de
cada objeto (tabla, policy, índice, función) para que la auditoría del PASO 3
pueda evaluarlo.

---
## PASO 3 · Auditoría (GATE DURO — no escribir código hasta completar)

Audit de calidad general:
  1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/audit-rules.md
  2. Imprimí la tabla completa con el status de cada regla.

Audit específico de backend (si tu tarea toca SQL):
  3. Para cada objeto SQL nuevo (tabla, policy, índice, función, trigger), revisá
     contra las 6 reglas invariantes del EPIC-BACKEND §"Convenciones SQL":
       □ snake_case lowercase (rule schema-lowercase-identifiers)
       □ PK bigint generated always as identity (rule schema-primary-keys)
       □ FK con índice explícito en la misma migración (rule schema-foreign-key-indexes)
       □ Policies usan (select auth.uid()) (rule security-rls-performance)
       □ Transacciones cortas, sin I/O dentro (rule lock-short-transactions)
       □ Jobs de queue usan FOR UPDATE SKIP LOCKED (rule lock-skip-locked)

  4. Si hay ❌ → reescribí el plan y volvé al punto 2.
  5. Solo pasás al PASO 4 con 0 ❌.

---
## PASO 4 · TDD — Tests primero

Para cada pieza no trivial:

Si es TS (Server Action, Route Handler, facade, repository):
  1. Escribí el test (*.test.ts).
  2. npx vitest run <file> → RED. Pegá output.
  3. Mínimo código para pasar.
  4. npx vitest run <file> → GREEN. Pegá output.
  5. Refactor manteniendo tests verdes.

Si es SQL (policies, funciones, triggers):
  1. Escribí el test pgTAP (.sql en supabase/tests/).
  2. pnpm supabase:test:rls o psql -f test.sql → RED.
  3. Mínimo SQL para pasar.
  4. Correr test de nuevo → GREEN. Pegá output.

Si es schema (migración nueva con tablas/índices):
  1. Escribí el test que valida forma del schema (columnas, FKs, índices).
  2. pnpm supabase:reset → corre la migración → corre test → GREEN.

Para código 100% trivial (re-export, type alias, config toml sin lógica):
documentalo: "Bx.y trivial — verificado en E2E de By.z".

---
## PASO 5 · Implementación

Escribí el código según el plan auditado:
- Archivos TS ≤300 líneas, componentes ≤200.
- Migraciones SQL ≤500 líneas (dividir por propósito si crece).
- Si tocás shared/ → actualizar REGISTRY.md y el detail file en el mismo turno.
- Respetar patrón (c'): @supabase/* SOLO en los 3 directorios permitidos
  (shared/repositories/supabase/, shared/services/*.supabase.ts, app/api/cron/**).
- npx tsc --noEmit después de cada archivo TS.
- pnpm supabase:db:diff después de cada migración nueva.

Si la tarea es UI (B9/B10/B11 swap tiene UI tocada):
  Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/ui-toolchain.md
  Seguí las instrucciones antes de tocar componentes visuales.

Si la tarea es SQL/DB:
  Revisá tu output SQL contra las 6 reglas una última vez antes de commit.

---
## PASO 6 · Verificación final

1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/verification.md
2. Si tu tarea toca DB, sumá estos checks:
   □ pnpm supabase:reset corre limpio (todas las migraciones desde cero)
   □ pnpm lint 0 warnings
   □ pnpm typecheck 0 errores
   □ pnpm test (suite completa) verde
   □ Si agregaste policies: pnpm supabase:test:rls verde
   □ Si agregaste índice de FK: scripts/db-audit-fk-indexes.sql sale vacío
   □ Si escribiste imports del SDK: scripts/check-supabase-imports.sh limpio
3. Pegá el output en el chat.
4. Si algo falla → fijalo antes de continuar.

---
## PASO 7 · Completion protocol

1. Abrí docs/EPIC-BACKEND.md.
2. Para cada task completada:
   - Cambiá estado a ✅ done.
   - Llená Notas: con archivos creados, decisiones, migraciones aplicadas,
     subtareas descubiertas.
   - Si el campo REGISTRY: del bloque lista un detail file, actualizá
     shared/REGISTRY.md + shared/REGISTRY-detail/<categoria>.md en el mismo commit.
3. Si descubriste tareas nuevas que no encajan en el epic → agregalas a
   docs/NEXT-TASK.md con el formato NT-NN estructurado. NO las agregues al epic.
4. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/debt-protocol.md
   Aplicalo a lo que quedó diferido.
5. Commit: feat(bX.Y): <descripción concisa imperativa>
6. Imprimí resumen: tareas ✅ done | archivos | migraciones | tests + coverage |
   próxima wave destrabada | decisiones que requieren confirmación del usuario.

---
## PASO 8 · Auto-continuación por cadena

No cierres el chat. Releé el bloque de la tarea en el epic y buscá Continues with:.

CASO A — No hay Continues with: o dice —
  Imprimí: "Cadena cerrada. No hay continuación." → continuá con PASO 9.

CASO B — Continues with: Bx.y
  1. Verificá que todas las Depends on: de Bx.y estén ✅.
  2. Verificá que Bx.y sea 🟢 (no 🟡 tomada por otro chat).
  3. Si está tomada → imprimí advertencia y detenete.
  4. Si está libre:
     - Imprimí: "🔗 Auto-continuación activada: claim de Bx.y"
     - Marcá 🟡 in-progress + commit: chore(epic-backend): claim Bx.y (auto-continue)
     - Reiniciá desde PASO 1 con la nueva tarea. NO saltees pasos.
  5. Al terminar Bx.y, volvé a chequear Continues with: y repetí hasta no más.

Regla: cada eslabón tiene su propio plan, auditoría (PASO 3), tests (PASO 4) y
verificación (PASO 6). La auto-continuación ahorra fricción — no relaja estándares.
Si la auditoría falla muchas veces o el PASO 6 no cierra → detené la cadena y reportá.

---
## PASO 9 · Code review final + cierre

1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/code-review-protocol.md
2. Seguilo completo: code review con segunda pasada, verificación post-fix, y
   consulta al usuario para commit + merge + borrado de worktree/branch.
3. Cleanup Supabase local:
     pnpm supabase:stop
4. Cleanup worktree:
     git -C /Users/martinoficialdegui/Desktop/ambulante worktree remove ../ambulante-b<task-id>

---
## Reglas de paralelismo

Antes de editar estos archivos, verificá que ninguna tarea 🟡 ajena los necesite:
  package.json / pnpm-lock.yaml | tailwind.config.ts | tsconfig.json | next.config.mjs
  app/layout.tsx | app/globals.css | middleware.ts | supabase/config.toml |
  shared/REGISTRY.md | docs/EPIC-BACKEND.md

Si hay dependencia oculta con una tarea 🟡 ajena → pausá y reportá.

Archivos especialmente sensibles en este epic:
  - supabase/config.toml: solo modifican B0.1, B4.1, B1.1. Si ya están ✅, no tocar.
  - supabase/migrations/_template.sql: solo B0.3.
  - scripts/db-audit-fk-indexes.sql: solo B1.5.
  - .eslintrc.json: solo B3.3.

---
## Prohibiciones duras (si las violás, la tarea no se acepta)

1. any en cualquier archivo.
2. @ts-ignore (si es inevitable: @ts-expect-error con comentario).
3. console.log en código de runtime (tests OK, runtime NO).
4. Archivos .md fuera de docs/ sin pedido explícito.
5. Dependencias npm sin justificarlas en el PASO 2.
6. git commit --no-verify o cualquier bypass de hooks.
7. git push sin que el usuario lo pida.
8. Modificar reglas de CLAUDE.md. Si una regla es imposible → parás y preguntás.
9. Imports de @supabase/* fuera de los 3 directorios permitidos.
10. Policies RLS con auth.uid() directo (sin envolver en (select ...)).
11. UPDATE/DELETE en queue sin FOR UPDATE SKIP LOCKED.
12. I/O externo (fetch, webpush.send, email) dentro de un BEGIN/COMMIT.
13. Magic strings / números (mover a shared/constants/).
14. SQL con identifiers mixedCase o quoted.
15. FK creada sin su índice en la misma migración.

---
## Formato de output

Entre pasos mayores, imprimí un separador:
---
## PASO N · Nombre del paso

---
## Empezá ahora

Arrancá por PASO 0. No pidas confirmación — ejecutá el flujo completo.
Si tenés duda genuina de scope/ambigüedad, pará y preguntá con opciones concretas.
Si al leer la skill encontrás un conflicto con el epic, reportalo antes de seguir.
```

---

## Ejemplos concretos

### Cabeza de cadena (auto-continuación)
```
B1.1
```
El agente lee `Continues with: B1.2 (cadena C-B1-schema)` y recorre B1.1 → B1.2 → B1.3 → B1.4 → B1.5 sin intervención.

### Tarea standalone
```
B0.2
```
El chat termina al cerrar B0.2.

### Bloque sin cadenas predefinidas
```
B5.3, B5.4
```
Solo cuando no hay cadena en el epic. Si hay cadena, siempre pasá la cabeza.

---

## Protocolo para abrir chats paralelos

1. Abrí `docs/EPIC-BACKEND.md` → buscá la fase y sus Waves en `docs/PARALLEL-EXECUTION-BACKEND.md`.
2. Para cada tarea en la wave activa, creá el worktree ANTES de abrir el chat:
   ```bash
   git worktree add ../ambulante-b<task-id> -b feat/b<task-id>-<slug>
   ```
3. Por cada tarea, abrí una ventana de Claude Code con cd al worktree:
   ```bash
   cd ~/Desktop/ambulante-b1-2 && claude
   ```
4. Pegá este template con `{{TASK_IDS}}` correspondiente.
5. Cuando alguno termina (PASO 7), la siguiente wave queda destrabada.

**Por qué worktrees son obligatorios:** ver `docs/PROMPT-TEMPLATE.md` (frontend) — mismo razonamiento aplica.

**Novedad backend:** además del worktree, cada chat necesita Supabase local corriendo. **Supabase CLI usa puertos fijos por default (54321-54324)**, así que **solo una instancia puede correr a la vez en tu máquina**. Dos worktrees de backend en paralelo chocan si ambos intentan `supabase:start`.

Estrategias para paralelizar chats de backend (elegí una según la tarea):

- **Estrategia 1 — Supabase compartida:** un solo `supabase:start` global, varios chats trabajan contra la misma DB. Sirve cuando los chats tocan schemas o features disjuntos y no resetean la DB. Riesgo: si un chat corre `supabase:reset`, destruye el trabajo del otro.
- **Estrategia 2 — Supabase serializada:** cada chat que corre tests levanta su Supabase (`supabase:start`), corre sus checks, y la baja (`supabase:stop`) antes de liberar el turno. Los chats coordinan cuál tiene el turno en el canal de la conversación del usuario. OK para tareas chicas.
- **Estrategia 3 — Customizar puertos por worktree:** override en `supabase/config.toml` con puertos distintos (54321 → 54331, etc.) por branch. Implementación pospuesta a NEXT-TASK.md porque complica el config.

Para el MVP, la regla práctica es: **tareas de la misma fase que tocan DB se serializan** (no son paralelas reales aunque abras dos worktrees simultáneos). Tareas de fases distintas sin intersección de schema sí pueden correr paralelo con Estrategia 1.

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| El agente salta el PASO 3 de audit SQL | Template mal pegado | Re-pegá completo |
| Dos chats claimean la misma tarea | Uno no commiteó rápido | Claim + commit ANTES de leer código |
| Agente importa @supabase en feature | Regla 9 no internalizada | Recordale: "lint falla si importás supabase fuera de los 3 dirs permitidos" |
| Migración falla al re-correr | Falta idempotencia | Usar DO $$ BEGIN IF NOT EXISTS ... (skill rule schema-constraints) |
| RLS test OK pero queries lentas en prod | `auth.uid()` directo, no `(select auth.uid())` | Lint SQL de B2.5 debería pescarlo; si no, correr B2.4 benchmark |
| `pnpm supabase:start` choca de puertos | Otro worktree lo dejó corriendo | `supabase stop --all` en el otro |

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Creación del template backend — basado en `PROMPT-TEMPLATE.md` frontend con: lectura obligatoria de skill supabase-postgres-best-practices, audit específico de las 6 reglas SQL, checks de backend en PASO 6, cleanup de Supabase local en PASO 9, prohibiciones extendidas 9-15. |
