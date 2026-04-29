# Code review final + cierre del worktree (PASO 9)

Este paso lo orquestra `/b-finish`. Documentado acá para que cualquier chat lo siga si se ejecuta manualmente.

---

## 9.1 · Pasada 1 — full review

1. Calculá los archivos modificados:
   ```bash
   git diff main...HEAD --name-only
   ```
2. Lanzá el agente `everything-claude-code:code-reviewer` pasándole la lista completa.
3. Tomá **todos los issues** (critical, high, medium, low).
4. **Antes de empezar a fixear**, marcá el commit actual como punto de referencia:
   ```bash
   git rev-parse HEAD > /tmp/.b-review-baseline
   ```
   Ese SHA es la base para la pasada 2 focalizada.

## 9.2 · Fixes

Aplicá los fixes según severidad:
- **CRITICAL + HIGH:** todos, sin excepción (regla del workflow).
- **MEDIUM:** todos los straightforward; los que cambian contrato → registrar como `DT-N` en `docs/EPIC-ARCHITECTURE.md § Deuda técnica` (ver `debt-protocol.md`) y diferir.
- **LOW:** mismo criterio que MEDIUM.

Por cada fix corré `npx tsc --noEmit --silent` y los tests del archivo tocado para no regresionar.

## 9.3 · Pasada 2 — focalizada en los fixes (no full)

**Objetivo:** detectar regresiones introducidas por los fixes de 9.2, no re-revisar todo el branch.

1. Calculá los archivos tocados DESDE la baseline:
   ```bash
   git diff "$(cat /tmp/.b-review-baseline)"...HEAD --name-only
   ```
2. Lanzá `everything-claude-code:code-reviewer` con **esa lista filtrada**.
3. **Gate:** la pasada 2 debe devolver 0 CRITICAL y 0 HIGH.
   - Si la pasada 2 detecta un issue que toca un archivo NO incluido en la lista filtrada (ej: regresión en otro archivo por cambio de contrato), entonces lanzá una pasada 3 full sobre todos los archivos del branch. No es lo común — sólo si pasada 2 lo gatilla.
4. Si quedan issues → fixealos, actualizá baseline (`git rev-parse HEAD > /tmp/.b-review-baseline`), volvé a 9.3 punto 1.

**Por qué no re-revisamos todo:** la pasada 1 ya validó el estado pre-fix. La pasada 2 enfocada cuesta ~5x menos en tokens y el riesgo de regresión silente está acotado al diff de los fixes.

## 9.4 · Verificación post-fix (silenciosa)

Corré los 4 checks de `verification.md`. NO pegues outputs verbosos — pegá solo el veredicto si todo pasa o el fragmento relevante si falla.

## 9.5 · Consulta al usuario (gestionada por `/b-finish`)

`/b-finish` imprime el bloque de confirmación. Esperá `s` (sí) antes de mergear / borrar worktree.

---

**Resumen:** pasada 1 full → fixes → pasada 2 focalizada en diff de fixes → gate 0/0 → verificación silenciosa → confirmación humana.
