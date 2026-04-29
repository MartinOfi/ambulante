# Protocolo de tareas backend — guía interna

> Este archivo lo lee el agente cuando arranca una tarea backend (lo invoca `/b-start`).
> Reemplaza al antiguo `PROMPT-TEMPLATE-BACKEND.md`.

## Principios

1. **Lectura mínima obligatoria.** Sólo cargás los archivos imprescindibles. NO leas el directorio `tasks/` entero ni el legacy `EPIC-BACKEND.md`.
2. **Output silencioso por default.** Logs verbosos sólo cuando aporten a una decisión. NO imprimas tablas/checklist completas si todo está OK.
3. **Una tarea por chat.** Si tu tarea tiene `Continues with: Bx.y`, NO auto-continúes. `/b-finish` te imprime el comando para arrancar Bx.y en chat nuevo.
4. **Worktree aislado siempre.** Lo gestiona `/b-start`.

---

## PASO 0 · Setup (lo gestiona `/b-start`)

`/b-start <ID>` ya creó el worktree, claimeó la tarea en INDEX, y dejó Supabase corriendo (compartido). Si llegás acá manualmente, seguí `/b-start.md`.

## PASO 1 · Lectura obligatoria — sólo lo siguiente

En este orden, con Read:

1. `docs/epic-backend/INDEX.md` — para ubicar tu tarea y verificar dependencias.
2. `docs/epic-backend/tasks/<TU_ID>.md` — bloque completo de la tarea.
3. **Sólo si tu tarea toca SQL/RLS/migraciones:** `docs/epic-backend/convenciones.md`.
4. **Sólo si tu tarea toca `@supabase/*` o repos/facades:** `docs/epic-backend/portabilidad.md`.
5. **Sólo si tu tarea cita una decisión BD-N:** `docs/epic-backend/decisiones.md`.
6. **Skill rules listadas** en el bloque de la tarea (campo `Skill rules aplicables:`):
   - `.claude/skills/supabase-postgres-best-practices/references/<rule>.md` — sólo las listadas.
   - Si no hay rules listadas y tu tarea no toca SQL, salteá esto.
7. **REGISTRY:** si tu tarea toca `shared/` (campo `REGISTRY:` no es `—`):
   - `shared/REGISTRY.md` — índice rápido.
   - `shared/REGISTRY-detail/<categoría>.md` — sólo el listado en el bloque.

**NO leas:** `CLAUDE.md` completo (asumí que ya lo tenés en contexto de sesión); `PRD.md` salvo que la tarea referencie una sección específica; `EPIC-BACKEND.md` legacy; otros tasks.

## PASO 2 · Plan corto

Imprimí en el chat un plan **numerado**, máximo 10 ítems. Cada ítem = un archivo o un bloque verificable. Si la tarea toca SQL, incluí esqueletos de las tablas/policies/funciones nuevas.

**No imprimas explicaciones largas.** El plan es para vos y para que el usuario te corrija si algo es obviamente incorrecto.

## PASO 3 · Audit pre-código (silencioso)

Seguí `docs/workflows/audit-rules.md`:
- Audit silencioso de las 30 reglas TS + 6 reglas SQL (si aplica).
- **Output:** `Audit pre-código: 30/30 ✅` (o `36/36 ✅` si SQL) en una línea, **o** sólo las violaciones con su fix.
- 0 ❌ obligatorio antes del PASO 4.

## PASO 4 · TDD

Por cada pieza no trivial:
- **TS:** test primero (RED) → mínimo código (GREEN) → refactor.
  - `npx vitest run <file> --reporter=dot` (silencioso).
  - Pegá sólo la línea de veredicto, no el log completo.
- **SQL:** pgTAP test → mínimo SQL → re-correr.
- **Trivial** (re-export, type alias, config sin lógica): documentar `Bx.y trivial — verificado en E2E de By.z`.

## PASO 5 · Implementación

Escribí el código según el plan auditado. Reglas:
- Archivos TS ≤300 líneas, componentes ≤200, migraciones SQL ≤500.
- Si tocás `shared/` → actualizar `REGISTRY.md` + detail file en el mismo turno.
- `@supabase/*` SOLO en los 3 directorios permitidos (ver `portabilidad.md`).
- Después de cada archivo TS: `npx tsc --noEmit --silent | tail -3`.
- Después de cada migración: `pnpm supabase:db:diff 2>&1 | tail -5`.

Si tu tarea es UI: leé `docs/workflows/ui-toolchain.md`.

## PASO 6 · Verificación final

Seguí `docs/workflows/verification.md`. Pegá sólo el veredicto compacto:

```
✅ tsc 0 errors · vitest <N> passed · max <N> lines · grep OK
```

Si algo falla → fijá antes de cerrar.

## PASO 7 · Completion

Antes de cerrar (`/b-finish` lo orquesta):
1. Actualizá `tasks/<TU_ID>.md`:
   - `Estado:` → `✅ done [owner: chat-<fecha>, closed: <fecha>]`
   - Llená `Notas:` con archivos creados, decisiones, migraciones aplicadas.
2. Actualizá `INDEX.md` si tu tarea movió la fase de % done (ej: `B7 2/5` → `B7 3/5`).
3. Si descubriste tareas nuevas fuera del epic → agregalas a `docs/NEXT-TASK.md` (formato NT-NN).
4. Aplicá `docs/workflows/debt-protocol.md` a items diferidos.
5. Commit: `feat(<task_id>): <descripción imperativa>`.

**NO auto-continues.** Si `Continues with: Bx.y`, `/b-finish` te imprime el comando para arrancar Bx.y en otro chat.

## PASO 8 · Cierre + code review (lo orquesta `/b-finish`)

`/b-finish` ejecuta `docs/workflows/code-review-protocol.md` (pasada 1 full + pasada 2 focalizada en diff de fixes), pide confirmación, mergea, borra worktree, y te imprime el comando para arrancar el siguiente eslabón si existe.

---

## Prohibiciones duras (rechazo automático)

1. `any` en cualquier archivo.
2. `@ts-ignore` (usar `@ts-expect-error` con razón).
3. `console.log` en runtime (tests OK).
4. Archivos `.md` fuera de `docs/` sin pedido explícito.
5. Dependencias npm sin justificarlas en el plan.
6. `git commit --no-verify` o cualquier bypass de hooks.
7. `git push` sin que el usuario lo pida.
8. Modificar reglas de `CLAUDE.md`.
9. Imports de `@supabase/*` fuera de los 3 directorios permitidos.
10. Policies RLS con `auth.uid()` directo (sin envolver en `(select ...)`).
11. UPDATE/DELETE en queue sin `FOR UPDATE SKIP LOCKED`.
12. I/O externo (fetch, webpush.send, email) dentro de un `BEGIN/COMMIT`.
13. Magic strings / números en código.
14. SQL con identifiers mixedCase o quoted.
15. FK creada sin índice en la misma migración.
