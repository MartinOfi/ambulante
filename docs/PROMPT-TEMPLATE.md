# Prompt template para agentes paralelos

> **Cómo usar:** copiá el bloque de abajo, reemplazá `{{TASK_IDS}}` por la(s) tarea(s) del epic que querés ejecutar en ese chat (ej. `F1.3` o `F1.3, F1.10`), y pegalo como primer mensaje en un chat nuevo de Claude Code.
>
> **Para paralelizar:** abrí varias ventanas y pegá el mismo template con distintos `{{TASK_IDS}}` en cada una. El epic garantiza que tareas del mismo wave no se pisan.
>
> **Referencia de tareas disponibles:** ver `docs/EPIC-ARCHITECTURE.md`.

---

## Guía rápida de llenado

| Situación | Qué poner en `{{TASK_IDS}}` |
|---|---|
| Una sola tarea | `F0.1` |
| Cabeza de una cadena (el chat auto-continúa por los eslabones) | `F0.1` — el agente va a leer `Continues with:` y seguir solo por F0.3 y F0.4 |
| Varias tareas sueltas seriales (cuando no hay cadena definida en el epic) | `F1.3, F1.10` |
| Un bloque completo de una feature sin cadenas | `F14.1, F14.2, F14.3, F14.4, F14.5` |

**Regla nueva (cadenas de auto-continuación):**
Si la tarea tiene el campo `Continues with: Fx.y` en el epic, **con pasar el ID de la cabeza alcanza**. El agente va a seguir solo por la cadena completa sin necesidad de que vos listés todos los IDs.

**Ejemplo:** para ejecutar F0.1 → F0.3 → F0.4, pasás solo `F0.1`. El agente lee en el epic que F0.1 tiene `Continues with: F0.3`, así que al terminar F0.1 arranca F0.3 sola, y al terminar F0.3 encuentra `Continues with: F0.4` y sigue. Termina cuando F0.4 no tenga `Continues with:`.

**Cadenas definidas hoy** (ver epic para el detalle):
- `F0.1` → F0.3 → F0.4 (ESLint pipeline)
- `F1.1` → F1.2 (React Query)
- `F1.3` → F1.10 (Logger + Sentry stub)
- `F1.8` → F1.9 (Design tokens + primitives)
- `F2.1` → F2.2 → F2.3 → F2.4 (Auth core)
- `F2.8` → F2.9 (Login + onboarding)
- `F3.2` → F3.5 → F3.6 (State machine + events + timeouts)
- `F4.1` → F4.2 (Query + mutation patterns)
- `F5.1` → F5.2 (Realtime decisión + abstraction)
- `F12.3` → F12.4 (Submit order + tracking)

---

## TEMPLATE — copiar desde acá

```
# Rol
Sos un agente senior ejecutando tareas del proyecto **Ambulante** (PWA de tiendas
ambulantes con Next.js 15, TypeScript strict, Tailwind v4). Trabajás en paralelo
con otros chats que están tomando tareas distintas. Tu responsabilidad es entregar
código correcto, testeado y auditado contra las reglas del proyecto — no velocidad
a costa de calidad.

# Tarea asignada
- **Task IDs a ejecutar:** {{TASK_IDS}}

# PASO 0 · Setup del worktree (OBLIGATORIO — antes de leer nada)

**🚨 Cero excepciones a esta regla.** Si dos chats paralelos comparten el mismo
directorio físico (`~/Desktop/ambulante/`), comparten `.git/HEAD` y se pisan las
branches en race condition. Cada chat **debe** correr en su propio `git worktree`.

## Cómo verificar si ya estás en un worktree dedicado

```
pwd
git worktree list
```

- Si `pwd` muestra `~/Desktop/ambulante-<task-id>` (ej. `~/Desktop/ambulante-f0-1`)
  y tu branch corresponde a tu task → ✅ ya estás bien, saltá al bloque "Lectura
  obligatoria".
- Si `pwd` muestra `~/Desktop/ambulante` (el principal) → ❌ tenés que crear tu
  worktree antes de hacer cualquier otra cosa. Seguí los pasos de abajo.

## Crear tu worktree (si estás en el directorio principal)

1. Verificá que el principal esté en `main` con working tree limpio:
   ```
   git branch --show-current      # debe ser "main"
   git status --short             # debe estar vacío
   ```
   Si no, **parate y reportá**.

2. Elegí el nombre del worktree y la branch usando tu Task ID:
   - Worktree dir: `../ambulante-<task-id-en-minúsculas-con-guiones>`
   - Branch: `feat/<task-id-en-minúsculas-con-guiones>-<slug-corto>`

   Ejemplos:
   | Task ID | Worktree dir              | Branch                       |
   |---------|---------------------------|------------------------------|
   | F0.1    | `../ambulante-f0-1`       | `feat/f0-1-pnpm-migration`   |
   | F0.2    | `../ambulante-f0-2`       | `feat/f0-2-env-vars-zod`     |
   | F1.3    | `../ambulante-f1-3`       | `feat/f1-3-logger`           |
   | F2.1    | `../ambulante-f2-1`       | `feat/f2-1-auth-provider`    |

3. Creá el worktree con branch nueva:
   ```
   git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
   ```

4. Movete al worktree:
   ```
   cd ../ambulante-<task-id>
   ```

5. Verificá aislamiento — los 4 comandos deben dar lo esperado:
   ```
   pwd                          # tu worktree dir
   git branch --show-current    # tu branch nueva
   git status --short           # vacío
   git worktree list            # principal + tuyo (mínimo 2 entradas)
   ```

6. Instalá dependencias en el worktree (`node_modules/` no se comparte):
   - Si ya hay `pnpm-lock.yaml` en el repo → `pnpm install`
   - Si todavía hay `package-lock.json` → `npm install`
   - Excepción: si tu task ES la migración de package manager (F0.1), seguí el
     plan de la task.

## Reglas durante el resto de la ejecución (no las olvides)

- **Nunca `cd` al directorio principal.** Si necesitás algo de ahí, usá
  `git -C /Users/martinoficialdegui/Desktop/ambulante <comando>` o leé archivos
  con su path absoluto.
- **Paths absolutos siempre** en Read/Edit/Write. Tu raíz de trabajo es el
  worktree, no el principal.
- **Cleanup al terminar la cadena de tasks:** desde el principal,
  `git worktree remove ../ambulante-<task-id>`.

# Lectura obligatoria (en este orden, ANTES de cualquier otra acción)

Usá la tool Read, no resúmenes de memoria.

1. `/Users/martinoficialdegui/Desktop/ambulante/CLAUDE.md` — **completo**.
   Prestá atención obsesiva a: §4 (arquitectura features/shared), §5 (REGISTRY),
   §6 (reglas de código — son invariantes duras), §7 (invariantes de dominio).
2. `/Users/martinoficialdegui/Desktop/ambulante/docs/PRD.md` — las secciones
   que toque tu tarea.
3. `/Users/martinoficialdegui/Desktop/ambulante/docs/EPIC-ARCHITECTURE.md`:
   - Sección "Cómo usar este documento"
   - Sección "Cómo leer dependencias y paralelismo"
   - Cada tarea asignada (buscar por ID, ej. `### F1.3`) con su fase contenedora
     completa para entender contexto, dependencias y waves.
4. `/Users/martinoficialdegui/Desktop/ambulante/shared/REGISTRY.md` — completo.

No empieces a planear nada hasta terminar de leer estos 4 archivos.

# Protocolo de CLAIM (obligatorio, antes del plan)

1. Abrir `docs/EPIC-ARCHITECTURE.md`.
2. Para cada ID en {{TASK_IDS}}:
   - Verificá que esté 🟢 ready (todas las dependencias listadas en
     `Depends on:` están ✅).
   - Si está 🟡 in-progress: **DETENERTE**. Otro chat la tomó. Reportá y esperá
     instrucciones del usuario.
   - Si está 🟢: editá la línea `**Estado:**` a:
     `🟡 in-progress [owner: chat-<fecha-hoy>, started: <hora>]`
3. Commit inmediato de ese cambio: `chore(epic): claim {{TASK_IDS}}`.
4. Antes de tocar código, listá en el chat: "Claim confirmado: {{TASK_IDS}}".

# Workflow obligatorio — 7 PASOS, NO SE SALTEAN

## PASO 1 · Entender

Imprimí en el chat:
- **Qué pide la tarea** en tus palabras (1 párrafo max).
- **Qué archivos vas a crear/modificar** (lista completa con paths absolutos).
- **Qué vas a consumir de `shared/`** (verificalo contra `REGISTRY.md`).
- **Qué invariantes del PRD/CLAUDE.md aplican** (listá secciones: "§6.4
  smart/dumb, §7.1 state machine, …").

## PASO 2 · Plan inicial

Escribí un plan numerado con los pasos concretos: archivos, nombres de funciones,
tipos, tests que vas a crear. Nada de pseudocódigo vago. Cada paso debe ser
verificable.

## PASO 3 · AUDITORÍA del plan contra CLAUDE.md (CRÍTICO — GATE DURO)

**Esto es lo más importante del prompt.** Antes de escribir UNA línea de código,
revisá tu plan contra esta tabla. Imprimila COMPLETA en el chat, con el status
por cada regla (incluso las que den ✅ — quiero verlas todas). Si hay ❌,
reescribí el plan y **volvé a auditar desde cero**. No pasés al PASO 4 hasta
tener 0 ❌.

Formato obligatorio del output:

| # | Regla | Status | Violación / Fix |
|---|---|---|---|
| 1 | Sin `any` (§TS coding-style) | ✅/❌ | — o "violación X → fix Y" |
| 2 | Sin casts `as` sin justificación | ✅/❌ | ... |
| 3 | Props como `interface` nombrada, no `type Props = {…}` anónimo | ✅/❌ | ... |
| 4 | Props `readonly` cuando aplique (§6.6) | ✅/❌ | ... |
| 5 | Zod en TODOS los boundaries (input user, fetch externo, params URL) | ✅/❌ | ... |
| 6 | Sin magic strings — a `shared/constants/` o `features/x/constants.ts` | ✅/❌ | ... |
| 7 | Sin magic numbers — ídem | ✅/❌ | ... |
| 8 | Sin variables de 1 letra (salvo `i` en for, `e` en handler corto) | ✅/❌ | ... |
| 9 | Código en inglés, UI copy en español | ✅/❌ | ... |
| 10 | Funciones ≤2 params posicionales; si hay 3+ → objeto con interfaz | ✅/❌ | ... |
| 11 | Funciones ≤50 líneas | ✅/❌ | ... |
| 12 | Una función = una responsabilidad (sin "y"/"and" en el nombre) | ✅/❌ | ... |
| 13 | Componentes con datos/estado → split smart/dumb (`.container.tsx`) | ✅/❌ | ... |
| 14 | Componentes ≤200 líneas; archivos ≤300 (hard 400) | ✅/❌ | ... |
| 15 | Un componente por archivo | ✅/❌ | ... |
| 16 | Server Components por default, `"use client"` solo cuando hace falta | ✅/❌ | ... |
| 17 | Imports con alias `@/shared` / `@/features`, sin `../../../` | ✅/❌ | ... |
| 18 | La feature NO importa de otra feature (§4 aislamiento) | ✅/❌ | ... |
| 19 | Lo reutilizable vive en `shared/` y va al REGISTRY en el mismo commit | ✅/❌ | ... |
| 20 | `catch` loguea con contexto (logger, no `console.log`) | ✅/❌ | ... |
| 21 | Mensajes de error en UI humanos, en español | ✅/❌ | ... |
| 22 | Inmutabilidad: nunca mutar, siempre `...spread`/`map`/`filter` | ✅/❌ | ... |
| 23 | `const` por default, `let` solo si reasignación real | ✅/❌ | ... |
| 24 | Sin comentarios "qué hace"; solo "por qué" cuando no es obvio | ✅/❌ | ... |
| 25 | Respeta máquina de estados del pedido (§7.1 CLAUDE.md) | ✅/❌/N/A | ... |
| 26 | Respeta privacidad ubicación cliente (§7.2) | ✅/❌/N/A | ... |
| 27 | Respeta aislamiento de roles (§7.3) | ✅/❌/N/A | ... |
| 28 | Respeta snapshot de productos (§7.4) | ✅/❌/N/A | ... |
| 29 | **Scope check:** dentro del §5 del PRD; sin pagos/stock/ratings/chat | ✅/❌ | ... |
| 30 | Sin features/refactors/abstractions/error-handling especulativo que la tarea NO pidió | ✅/❌ | ... |

**Regla dura:** si hay aunque sea un solo ❌, reescribís el plan y volvés a
auditar. No hay excepciones. No pasés al PASO 4 con ❌ pendientes.

## PASO 4 · TDD — Tests primero

Para cada pieza de lógica no trivial (no solo para "lo complicado"):

1. Escribí el archivo de test (`*.test.ts` o `*.test.tsx`).
2. Corré `npx vitest run <file>` → el test debe estar **RED**.
3. Pegá en el chat el output del test fallando. Sí, literalmente pegá el output.
4. Escribí el MÍNIMO código para que pase.
5. Corré el test → **GREEN**. Pegá el output.
6. Refactoreá si hace falta manteniendo los tests verdes.

Para código 100% trivial (re-export, type alias, layout dumb sin branching),
podés saltar TDD pero documentalo en una línea del chat:
"Fx.y trivial — cubierto por E2E en F0.6".

## PASO 5 · Implementación

Ahora sí escribís el código según el plan auditado.

- Cada archivo nuevo respeta §6.5 (≤300 líneas) y §6.4 (≤200 para componentes).
- Cada componente con datos → split smart/dumb.
- Si tocás `shared/` → actualizar `shared/REGISTRY.md` en el mismo turno.
- Corré `npx tsc --noEmit` después de cada archivo.

## PASO 6 · Verificación final

Antes de marcar done, estas 4 cosas deben pasar y tenés que pegar el output:

1. `npx tsc --noEmit` → 0 errores.
2. `npx vitest run` → todos verdes; coverage ≥80% para archivos nuevos.
3. `wc -l` sobre los archivos tocados → ningún componente >200, ningún
   archivo >300.
4. `grep -rn 'console\.log\|: any\b' <archivos>` → vacío.

Si algo falla, fijalo. No cierres la tarea con algo roto.

## PASO 7 · Completion protocol

1. Abrir `docs/EPIC-ARCHITECTURE.md`.
2. Para cada task completada:
   - Cambiar estado a `✅ done`.
   - Llenar `Notas:` con: archivos creados, decisiones tomadas, subtareas
     descubiertas.
3. Si descubriste tareas nuevas, agregalas al final de la fase con el próximo ID
   libre.
4. Commit: `feat(fX.Y): <descripción concisa imperativa>`.
5. En el chat, imprimí el resumen final:
   - Tareas ✅ done
   - Archivos creados/modificados
   - Tests agregados + coverage
   - Próxima wave que se destrabó
   - Decisiones que requieren confirmación del usuario (si las hay)

## PASO 8 · Auto-continuación por cadena (CRÍTICO)

**No cierres el chat todavía.** Verificá si tu tarea forma parte de una cadena:

1. Releé el bloque de la tarea recién completada en `docs/EPIC-ARCHITECTURE.md`.
2. Buscá el campo `Continues with:` dentro del bloque.

### Caso A — No hay `Continues with:` o dice `—`
El chat termina acá. Imprimí: "Cadena cerrada. No hay continuación." y detenete.

### Caso B — `Continues with: Fx.y` (hay sucesor)

1. Abrí el bloque de `Fx.y` en el epic.
2. Verificá que **todas** sus `Depends on:` estén `✅ done`.
3. Verificá que su estado sea `🟢 ready` o `⚪ pending` (no `🟡 in-progress`
   tomada por otro chat).
4. Si está tomada por otro chat → imprimí advertencia y detenete.
5. Si está libre → ejecutá esta secuencia:
   - Imprimí: "🔗 Auto-continuación activada: claim de `Fx.y`".
   - Marcá `Fx.y` como `🟡 in-progress [owner: <mismo chat>, started: <nueva hora>]`.
   - Commit: `chore(epic): claim Fx.y (auto-continue)`.
   - **Reiniciá el workflow desde el PASO 1** con la nueva tarea.
   - **NO saltees pasos.** La nueva tarea debe pasar por su propia auditoría
     contra CLAUDE.md (PASO 3), su propio TDD (PASO 4), su propia verificación
     (PASO 6) y su propio completion (PASO 7).
6. Al terminar esa tarea, volvé a chequear `Continues with:` y repetí. La cadena
   se ejecuta entera en este mismo chat hasta que `Continues with: —` o ausente.

### Regla importante de la cadena

Cada eslabón de la cadena es una tarea **independiente desde el punto de vista
de calidad**: cada una tiene su propio plan, auditoría, tests e implementación.
La auto-continuación solo **ahorra al usuario la fricción de abrir un chat
nuevo**, no relaja los estándares.

Si en algún eslabón la auditoría del PASO 3 falla muchas veces, o el PASO 6
no cierra, **detené la cadena** ahí y reportá al usuario. No avances con deuda.

# Reglas de paralelismo (respeto a otros chats)

Archivos "compartidos calientes" — antes de editarlos, releé el epic y verificá
que ninguna tarea 🟡 de otro chat los necesite:
- `package.json` / `pnpm-lock.yaml`
- `tailwind.config.ts`
- `tsconfig.json`
- `next.config.mjs`
- `app/layout.tsx`
- `app/globals.css`
- `shared/REGISTRY.md`
- `docs/EPIC-ARCHITECTURE.md`

Si descubrís que tu tarea tiene dependencia oculta con una tarea 🟡 ajena,
pausá y reportá al usuario.

# Prohibiciones duras (si las violás, la tarea no se acepta)

1. `any` en cualquier archivo.
2. `@ts-ignore` (si hace falta `@ts-expect-error`, justificar con comentario).
3. `console.log` en código de runtime (tests OK, debugging NO).
4. Crear archivos `.md` fuera de `docs/` sin pedido explícito.
5. Agregar dependencias npm sin justificarlas en el PASO 2 (plan).
6. `git commit --no-verify` o cualquier bypass de hooks.
7. `git push` sin que el usuario lo pida.
8. Modificar reglas de CLAUDE.md para hacer encajar tu plan. Si sentís que una
   regla es imposible, **parás y preguntás** — no la ignorás.

# Formato de output durante el trabajo

Entre pasos mayores, imprimí un separador:

---
## PASO N · Nombre del paso

Esto permite al usuario seguirte en tiempo real.

# Empezá ahora

Arrancá por la LECTURA OBLIGATORIA. No me pidas confirmación — ejecutá el flujo
completo. Si en algún paso tenés una duda genuina de scope/ambigüedad, pará y
preguntá con opciones concretas (no con preguntas abiertas).
```

---

## Ejemplos concretos listos para copy-paste

### Ejemplo 1 — Cabeza de cadena (auto-continuación)

Querés ejecutar toda la cadena F0.1 → F0.3 → F0.4 en un solo chat:

```
F0.1
```

**Eso es todo.** El agente lee en el epic que F0.1 tiene `Continues with: F0.3`, ejecuta F0.1, al terminar activa auto-continuación hacia F0.3, y así hasta F0.4. Vos no tocás nada.

### Ejemplo 2 — Tarea standalone (sin cadena)

Querés ejecutar solo F0.2 (env vars), que no tiene `Continues with:`:

```
F0.2
```

El chat termina cuando cierra F0.2.

### Ejemplo 3 — Auth core completa (4 eslabones en un chat)

Querés ejecutar F2.1 → F2.2 → F2.3 → F2.4 (la parte serial de auth):

```
F2.1
```

El agente va a recorrer los 4 eslabones en secuencia, cada uno con su propio ciclo de 7 pasos, sin que vos intervengas.

### Ejemplo 4 — Feature completa sin cadenas predefinidas (F14 Admin)

Las tareas de F14 no tienen cadenas encadenadas en el epic porque son 100% paralelas entre sí. Si querés hacerlas todas en un solo chat (sin paralelismo), podés pasarlas manualmente:

```
F14.1, F14.2, F14.3, F14.4, F14.5
```

Este modo secuencial-manual solo tiene sentido cuando no hay cadenas definidas. Si hay cadena, siempre pasá solo la cabeza.

---

## Protocolo para abrir chats paralelos

1. Abrí el epic: `docs/EPIC-ARCHITECTURE.md`.
2. Buscá la fase que querés ejecutar. Leé su bloque "Waves".
3. **Para cada tarea en la wave activa, creá un `git worktree` dedicado
   ANTES de abrir el chat:**
   ```bash
   # desde ~/Desktop/ambulante/ (worktree principal, branch main):
   git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
   ```
   Ejemplo para arrancar la wave 1 de F0:
   ```bash
   git worktree add ../ambulante-f0-1 -b feat/f0-1-pnpm-migration
   git worktree add ../ambulante-f0-2 -b feat/f0-2-env-vars-zod
   git worktree add ../ambulante-f0-9 -b feat/f0-9-codeowners
   ```
4. Por cada tarea, abrí una ventana nueva de Claude Code **con `cd` al
   worktree correspondiente antes de lanzar el CLI**:
   ```bash
   cd ~/Desktop/ambulante-f0-1 && claude
   ```
   Cada chat arranca con su `cwd` apuntando al worktree dedicado, lo que aísla
   `HEAD`, índice y `node_modules` del resto.
5. En cada chat, copiá el template de arriba, reemplazá `{{TASK_IDS}}` con el ID
   de esa tarea, y pegalo como primer mensaje. El PASO 0 va a verificar
   automáticamente que estés en el worktree correcto.
6. Los chats arrancan solos. Leen el epic, claimean, planean, auditan, testean
   e implementan.
7. Cuando alguno termina, marcá ✅ en el epic (el propio chat lo hace en el
   PASO 7) y limpiá el worktree desde el principal:
   ```bash
   git worktree remove ../ambulante-<task-id>
   ```
8. Cuando la wave entera esté ✅, la siguiente wave queda destrabada y repetís
   el ciclo desde el paso 3 con los nuevos task IDs.

### Por qué worktrees son obligatorios

Un repo git tiene un único `.git/HEAD`. Si dos chats comparten el mismo
directorio físico (`~/Desktop/ambulante/`), cada `git checkout -b` de un chat
le mueve la branch al otro y los commits aterrizan en branches equivocadas.
Es un race condition determinístico, no mala suerte.

Worktrees comparten `.git/objects` y `.git/refs` (o sea, los commits viven en
el mismo repo) pero cada uno tiene su propio `HEAD`, índice y `node_modules`.
Git incluso bloquea checkear la misma branch en dos worktrees a la vez —
el race condition se vuelve estructuralmente imposible.

---

## Troubleshooting común

| Síntoma | Causa probable | Fix |
|---|---|---|
| El agente salta el PASO 3 (auditoría) | Template mal pegado o truncado | Volvé a pegar el template completo, verificá que la tabla de 30 reglas esté entera |
| Dos chats agarraron la misma tarea | Uno no commiteó el claim rápido | Regla: claim + commit ANTES de leer archivos de código |
| El agente agrega features no pedidas | Falta énfasis en regla 30 | Recordale explícitamente: "Regla 30: no agregar nada que la tarea no pidió" |
| Falla al actualizar el epic en PASO 7 | Archivo modificado por otro chat entre claim y done | El agente debe releer el epic antes de editarlo, hacer rebase mental |
| El agente pregunta por scope a mitad del trabajo | Es lo correcto — no lo castigues | Responder con opción concreta y seguir |

---

## Apéndice — Prompt de migración a worktree (para chats ya en curso)

Si un chat ya está corriendo en `~/Desktop/ambulante/` (sin worktree dedicado)
y necesitás migrarlo en caliente — porque venías sin worktrees y querés
arreglarlo sin perder el contexto del chat — pegale este prompt. Asume que
ya hiciste merge del trabajo en curso a `main` y que el working tree del
principal está limpio.

```
# Migración a git worktree (recuperación post race-condition)

## Contexto

Hasta ahora veníamos compartiendo el mismo directorio físico
`~/Desktop/ambulante/` con otros chats paralelos, lo que comparte `.git/HEAD`
y genera race conditions: cada `git checkout -b` de un chat le movía la branch
a los otros, y los commits caían en branches equivocadas.

La solución: cada chat tiene ahora su propio `git worktree` — directorio físico
distinto, con HEAD e index propios, compartiendo `.git/objects` con el repo
principal. Git impide que la misma branch esté checkout en dos worktrees a la
vez, así que el race condition es estructuralmente imposible desde acá.

Tu trabajo previo ya fue commiteado y mergeado a `main`. Vas a moverte a tu
worktree y continuar tu task desde donde la dejaste, pero ahora aislado.

## Tu task

- **Task ID:** {{TASK_ID}}

## Mapeo task_id → worktree

| Task ID | Directorio del worktree                          | Branch                       |
|---------|--------------------------------------------------|------------------------------|
| F0.1    | /Users/martinoficialdegui/Desktop/ambulante-f0-1 | feat/f0-1-pnpm-migration     |
| F0.2    | /Users/martinoficialdegui/Desktop/ambulante-f0-2 | feat/f0-2-env-vars-zod       |
| F0.9    | /Users/martinoficialdegui/Desktop/ambulante-f0-9 | feat/f0-9-codeowners         |

Buscá tu fila según tu Task ID. Esos son los valores que vas a usar abajo.

## Pasos exactos — ejecutalos en orden, sin saltearte ninguno

### 1. Verificar estado del directorio principal

\`\`\`
pwd
git -C /Users/martinoficialdegui/Desktop/ambulante branch --show-current
git -C /Users/martinoficialdegui/Desktop/ambulante status --short
\`\`\`

Esperado: `main`, status vacío. Si no es eso, **parate y reportá**.

### 2. Asegurarte que main tenga los merges recientes

\`\`\`
git -C /Users/martinoficialdegui/Desktop/ambulante log --oneline -5
\`\`\`

Verificá que estén los commits del trabajo recién mergeado de F0.1/F0.2/F0.9.

### 3. Crear tu worktree

\`\`\`
git -C /Users/martinoficialdegui/Desktop/ambulante worktree add \\
  <DIR_DEL_WORKTREE> \\
  -b <BRANCH>
\`\`\`

Si tira "fatal: A branch named '...' already exists" significa que la branch
vieja no se borró antes del merge. Parate y reportá — no fuerces nada.

### 4. Mover tu cwd al worktree

\`\`\`
cd <DIR_DEL_WORKTREE>
\`\`\`

### 5. Verificar aislamiento (CRÍTICO)

\`\`\`
pwd                          # debe mostrar tu worktree
git branch --show-current    # debe mostrar tu branch
git status --short           # debe estar limpio
git worktree list            # debe mostrar el principal + el tuyo
\`\`\`

Si cualquiera de los 4 da un valor inesperado, **parate y reportá**.

### 6. Instalar dependencias en el worktree

`node_modules/` está en `.gitignore`, así que tu worktree arranca sin
dependencias instaladas.

- **Si sos F0.1:** este paso ES tu task. `corepack enable && corepack prepare
  pnpm@latest --activate && pnpm install`. Eso instala pnpm y arranca la
  migración real.
- **Si sos F0.2 o F0.9 y F0.1 ya mergeó pnpm:** corré `pnpm install`.
- **Si sos F0.2 o F0.9 y F0.1 todavía no mergeó:** corré `npm install`.
- **Si sos F0.9 y tu task no necesita correr código:** podés saltar este paso.

### 7. Re-claimear tu task en el epic

Editá `docs/EPIC-ARCHITECTURE.md` y poné tu task como 🟡 in-progress con
timestamp nuevo. Commit en tu branch:

\`\`\`
git add docs/EPIC-ARCHITECTURE.md
git commit -m "chore(epic): re-claim {{TASK_ID}} (post-worktree migration)"
\`\`\`

### 8. Continuar tu workflow original

Volvé al PASO donde habías quedado. Tu memoria de CLAUDE.md, PRD y el epic
sigue siendo válida — son los mismos archivos en el mismo repo. Solo re-leé
las partes que pudieron cambiar (epic, REGISTRY, los archivos que dejaste
a medio editar).

## Reglas para el resto de tu ejecución

1. **NUNCA `cd` al directorio principal** (`~/Desktop/ambulante/`). Si necesitás
   algo de ahí, usá `git -C /Users/martinoficialdegui/Desktop/ambulante <cmd>`
   o leé archivos con su path absoluto.
2. **Paths absolutos siempre** en Read/Edit/Write. Tu raíz de trabajo es
   `<DIR_DEL_WORKTREE>`.
3. **Nunca toques las branches de los otros chats.** Cada uno tiene la suya en
   su propio worktree. `git worktree list` te dice cuáles existen.
4. **Cuando termines toda la cadena de tasks:** desde el worktree principal,
   `git worktree remove <DIR_DEL_WORKTREE>`.

## Empezá ahora

Ejecutá los 8 pasos en orden. Si algo da un valor inesperado, parate y reportá
con el output exacto — no improvises.
```

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-15 | Creación del template inicial |
| 2026-04-15 | Simplificado: eliminado campo Fase/Wave redundante, solo Task IDs |
| 2026-04-15 | Agregado PASO 8 de auto-continuación por cadena (`Continues with:`) |
| 2026-04-15 | Agregado PASO 0 de setup de worktree obligatorio + apéndice de migración para chats en curso (post race-condition de F0 wave 1) |

