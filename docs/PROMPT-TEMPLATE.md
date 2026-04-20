# Prompt template para agentes paralelos

> **Cómo usar:** copiá el bloque de abajo, reemplazá `{{TASK_IDS}}` con la(s) tarea(s) del epic que querés ejecutar, y pegalo como primer mensaje en un chat nuevo de Claude Code.
>
> **Para paralelizar:** abrí varias ventanas con distintos `{{TASK_IDS}}` en cada una. El epic garantiza que tareas del mismo wave no se pisan.
>
> **Referencia de tareas disponibles:** `docs/EPIC-ARCHITECTURE.md`

---

## Guía rápida de llenado

| Situación | Qué poner en `{{TASK_IDS}}` |
|---|---|
| Una sola tarea | `F0.1` |
| Cabeza de una cadena | `F0.1` — el agente lee `Continues with:` y sigue solo |
| Varias tareas sueltas seriales (sin cadena en el epic) | `F1.3, F1.10` |
| Bloque completo de una feature sin cadenas | `F14.1, F14.2, F14.3` |

**Cadenas de auto-continuación:** si la tarea tiene `Continues with: Fx.y` en el epic, pasás solo la cabeza y el agente recorre la cadena completa solo.

**Cadenas definidas** (ver epic para el detalle actualizado):
- `F0.1` → F0.3 → F0.4
- `F1.1` → F1.2
- `F1.3` → F1.10
- `F1.8` → F1.9
- `F2.1` → F2.2 → F2.3 → F2.4
- `F2.8` → F2.9
- `F3.2` → F3.5 → F3.6
- `F4.1` → F4.2
- `F5.1` → F5.2
- `F12.3` → F12.4

---

## TEMPLATE — copiar desde acá

```
# Rol
Sos un agente senior ejecutando tareas del proyecto Ambulante (PWA de tiendas ambulantes
con Next.js 15, TypeScript strict, Tailwind v4). Trabajás en paralelo con otros chats.
Tu responsabilidad es entregar código correcto, testeado y auditado — no velocidad a
costa de calidad.

# Tarea asignada
Task IDs a ejecutar: {{TASK_IDS}}

---
## PASO 0 · Setup del worktree (OBLIGATORIO — antes de cualquier otra acción)

AUTO-CHECK — ejecutá esto PRIMERO:

  git branch --show-current

- feat/... → ya estás en tu worktree. Saltá a "Lectura obligatoria".
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
       Worktree dir: ../ambulante-<task-id-con-guiones>
       Branch:       feat/<task-id-con-guiones>-<slug-corto>

  3. Creá: git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>

  4. Movete: cd ../ambulante-<task-id>

  5. Verificá aislamiento (los 4 deben dar lo esperado):
       pwd                        # tu worktree dir
       git branch --show-current  # tu branch nueva
       git status --short         # vacío
       git worktree list          # principal + tuyo (mínimo 2)

  6. Instalá dependencias (node_modules/ no se comparte):
       pnpm-lock.yaml existe → pnpm install
       package-lock.json existe → npm install
       Si tu task ES la migración F0.1 → seguí su plan.

Reglas durante la ejecución:
- Nunca cd al principal. Usá git -C /Users/martinoficialdegui/Desktop/ambulante <cmd>.
- Paths absolutos siempre en Read/Edit/Write.
- Cleanup al terminar la cadena: lo gestiona el PASO 9.

---
## Lectura obligatoria (en este orden, ANTES de planear nada)

Usá Read tool, no memoria.

1. /Users/martinoficialdegui/Desktop/ambulante/CLAUDE.md — completo.
   Atención a §4 (arquitectura), §5 (REGISTRY), §6 (reglas), §7 (invariantes).
2. /Users/martinoficialdegui/Desktop/ambulante/docs/PRD.md — secciones que toca tu tarea.
3. /Users/martinoficialdegui/Desktop/ambulante/docs/EPIC-ARCHITECTURE.md:
   - "Cómo usar este documento" y "Cómo leer dependencias y paralelismo"
   - Bloque de cada tarea asignada con su fase completa.
4. /Users/martinoficialdegui/Desktop/ambulante/shared/REGISTRY.md — índice rápido + routing.
   Luego solo el detail file relevante de shared/REGISTRY-detail/ según tu tarea:
   ui.md / data.md / domain.md / infra.md / features.md / testing.md

---
## Protocolo de CLAIM (antes del plan)

1. Abrí docs/EPIC-ARCHITECTURE.md.
2. Para cada ID en {{TASK_IDS}}:
   - 🟢 ready       → editá Estado a: 🟡 in-progress [owner: chat-<fecha>, started: <hora>]
   - 🟡 in-progress → STOP. Otro chat la tomó. Reportá y esperá instrucciones.
3. Commit inmediato: chore(epic): claim {{TASK_IDS}}
4. Imprimí en el chat: "Claim confirmado: {{TASK_IDS}}"

---
## PASO 1 · Entender

Imprimí en el chat:
- Qué pide la tarea (1 párrafo max).
- Qué archivos vas a crear/modificar (paths absolutos).
- Qué vas a consumir de shared/ (verificado contra REGISTRY).
- Qué invariantes aplican (ej: "§6.4 smart/dumb, §7.1 state machine").

---
## PASO 2 · Plan inicial

Plan numerado con pasos concretos: archivos, nombres de funciones, tipos, tests.
Sin pseudocódigo vago. Cada paso debe ser verificable.

---
## PASO 3 · Auditoría (GATE DURO — no escribir código hasta completar)

1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/audit-rules.md
2. Imprimí la tabla completa en el chat con el status de cada regla.
3. Si hay ❌ → reescribí el plan y volvé al punto 2.
4. Solo pasás al PASO 4 con 0 ❌.

---
## PASO 4 · TDD — Tests primero

Para cada pieza de lógica no trivial:
1. Escribí el test (*.test.ts o *.test.tsx).
2. npx vitest run <file> → debe estar RED. Pegá el output.
3. Escribí el MÍNIMO código para que pase.
4. npx vitest run <file> → GREEN. Pegá el output.
5. Refactoreá manteniendo tests verdes.

Para código 100% trivial (re-export, type alias, layout dumb sin branching):
documentalo: "Fx.y trivial — cubierto por E2E en F0.6".

---
## PASO 5 · Implementación

Escribí el código según el plan auditado:
- Archivos ≤300 líneas, componentes ≤200.
- Componentes con datos → split smart/dumb (.container.tsx).
- Si tocás shared/ → actualizar REGISTRY.md y el detail file en el mismo turno.
- npx tsc --noEmit después de cada archivo.

Si la tarea es UI/estética (diseño visual, componentes, animaciones, ilustraciones):
  Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/ui-toolchain.md
  Seguí las instrucciones antes de escribir cualquier código visual.

---
## PASO 6 · Verificación final

1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/verification.md
2. Ejecutá los 4 checks y pegá el output en el chat.
3. Si algo falla → fijalo antes de continuar.

---
## PASO 7 · Completion protocol

1. Abrí docs/EPIC-ARCHITECTURE.md.
2. Para cada task completada:
   - Cambiá estado a ✅ done.
   - Llenó Notas: con archivos creados, decisiones, subtareas descubiertas.
3. Si descubriste tareas nuevas → agregalas al final de la fase con el próximo ID libre.
4. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/debt-protocol.md
   Aplicalo a todo lo que quedó diferido.
5. Commit: feat(fX.Y): <descripción concisa imperativa>
6. Imprimí resumen: tareas ✅ done | archivos | tests + coverage | próxima wave destrabada
   | decisiones que requieren confirmación del usuario.

---
## PASO 8 · Auto-continuación por cadena

No cierres el chat. Releé el bloque de la tarea en el epic y buscá Continues with:.

CASO A — No hay Continues with: o dice —
  Imprimí: "Cadena cerrada. No hay continuación." → continuá con PASO 9.

CASO B — Continues with: Fx.y
  1. Verificá que todas las Depends on: de Fx.y estén ✅.
  2. Verificá que Fx.y sea 🟢 (no 🟡 tomada por otro chat).
  3. Si está tomada → imprimí advertencia y detenete.
  4. Si está libre:
     - Imprimí: "🔗 Auto-continuación activada: claim de Fx.y"
     - Marcá 🟡 in-progress + commit: chore(epic): claim Fx.y (auto-continue)
     - Reiniciá desde PASO 1 con la nueva tarea. NO saltees ningún paso.
  5. Al terminar Fx.y, volvé a chequear Continues with: y repetí hasta que no haya más.

Regla: cada eslabón tiene su propio plan, auditoría (PASO 3), tests (PASO 4) y
verificación (PASO 6). La auto-continuación ahorra fricción — no relaja estándares.
Si la auditoría falla muchas veces o el PASO 6 no cierra → detené la cadena y reportá.

---
## PASO 9 · Code review final + cierre

1. Read /Users/martinoficialdegui/Desktop/ambulante/docs/workflows/code-review-protocol.md
2. Seguilo completo: code review con segunda pasada, verificación post-fix, y consulta
   al usuario para commit + merge + borrado de worktree/branch.

---
## Reglas de paralelismo

Antes de editar estos archivos, verificá que ninguna tarea 🟡 ajena los necesite:
  package.json / pnpm-lock.yaml | tailwind.config.ts | tsconfig.json | next.config.mjs
  app/layout.tsx | app/globals.css | shared/REGISTRY.md | docs/EPIC-ARCHITECTURE.md

Si hay dependencia oculta con una tarea 🟡 ajena → pausá y reportá.

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

---
## Formato de output

Entre pasos mayores, imprimí un separador:
---
## PASO N · Nombre del paso

---
## Empezá ahora

Arrancá por PASO 0. No pidas confirmación — ejecutá el flujo completo.
Si tenés duda genuina de scope/ambigüedad, pará y preguntá con opciones concretas.
```

---

## Ejemplos concretos

### Cabeza de cadena (auto-continuación)
```
F0.1
```
El agente lee `Continues with:` y recorre F0.1 → F0.3 → F0.4 sin intervención.

### Tarea standalone
```
F0.2
```
El chat termina al cerrar F0.2.

### Bloque sin cadenas predefinidas
```
F14.1, F14.2, F14.3, F14.4, F14.5
```
Solo cuando no hay cadenas definidas en el epic. Si hay cadena, siempre pasá la cabeza.

---

## Protocolo para abrir chats paralelos

1. Abrí `docs/EPIC-ARCHITECTURE.md` → buscá la fase y sus Waves.
2. Para cada tarea en la wave activa, creá el worktree ANTES de abrir el chat:
   ```bash
   # desde ~/Desktop/ambulante/ (branch main, working tree limpio):
   git worktree add ../ambulante-<task-id> -b feat/<task-id>-<slug>
   ```
3. Por cada tarea, abrí una ventana de Claude Code con cd al worktree:
   ```bash
   cd ~/Desktop/ambulante-f0-1 && claude
   ```
4. Pegá el template con `{{TASK_IDS}}` correspondiente. El PASO 0 verifica el aislamiento automáticamente.
5. Cuando alguno termina (el chat lo marca ✅ en PASO 7), la siguiente wave queda destrabada.

**Por qué worktrees son obligatorios:** un repo git tiene un único `.git/HEAD`. Si dos chats comparten el mismo directorio, cada `git checkout -b` le mueve la branch al otro — race condition determinístico. Worktrees comparten `.git/objects` pero cada uno tiene su propio `HEAD` e índice. Git impide checkout de la misma branch en dos worktrees a la vez.

---

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| El agente salta el PASO 3 | Template mal pegado o truncado | Re-pegá el template completo, verificá que llegue hasta "Empezá ahora" |
| Dos chats agarraron la misma tarea | Uno no commiteó el claim rápido | Regla: claim + commit ANTES de leer código |
| El agente agrega features no pedidas | Regla 30 no internalizada | Recordale: "Regla 30: nada que la tarea no pidió" |
| Falla al actualizar el epic en PASO 7 | Otro chat lo editó entre claim y done | El agente debe releer el epic antes de editar; resolver conflicto manualmente |
| El agente pregunta scope a mitad del trabajo | Es correcto — no lo castigues | Respondá con opción concreta y seguí |
| Chat compactó y el agente "olvida" reglas | Era el diseño anterior (monolito) | El template actual lee reglas desde disco en cada gate — no hay qué olvidar |

---

## Migración a worktree para chats en curso

Si un chat ya está corriendo sin worktree dedicado, ver:
`docs/workflows/worktree-migration.md`

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-15 | Creación del template inicial |
| 2026-04-15 | Simplificado: eliminado campo Fase/Wave redundante |
| 2026-04-15 | Agregado PASO 8 de auto-continuación por cadena |
| 2026-04-15 | Agregado PASO 0 de setup de worktree obligatorio |
| 2026-04-17 | Agregado toolchain obligatorio para tareas UI/estéticas en PASO 5 |
| 2026-04-19 | Agregado PASO 9: code review final con segunda pasada obligatoria |
| 2026-04-20 | Agregado auto-check al inicio del PASO 0 |
| 2026-04-20 | Agregado protocolo de deuda técnica en PASO 7 |
| 2026-04-20 | PASO 9.1: todos los issues deben resolverse (excepción: protocolo de deuda) |
| 2026-04-20 | Rediseño arquitectural: skeleton (~160 líneas pegadas) + docs/workflows/ (6 archivos de referencia). Reglas y tablas siempre leídas desde disco — no dependen de memoria comprimida |
