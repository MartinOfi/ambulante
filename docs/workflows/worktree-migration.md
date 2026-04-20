# Migración a git worktree (recuperación post race-condition)

Usá este prompt cuando un chat ya está corriendo en `~/Desktop/ambulante/` sin worktree dedicado y necesitás migrarlo en caliente. Asume que el trabajo en curso ya fue mergeado a `main` y que el working tree del principal está limpio.

Pegá el bloque de abajo en el chat que necesita migrar, reemplazando `{{TASK_ID}}` con el ID correspondiente.

---

```
# Migración a git worktree (recuperación post race-condition)

## Contexto

Hasta ahora compartíamos el directorio físico ~/Desktop/ambulante/ con otros chats paralelos.
Eso comparte .git/HEAD y genera race conditions: cada git checkout -b de un chat le movía
la branch a los otros.

Solución: cada chat tiene ahora su propio git worktree — directorio físico distinto con
HEAD e index propios, compartiendo .git/objects con el repo principal. Git impide que la
misma branch esté checkout en dos worktrees a la vez — el race condition es
estructuralmente imposible.

Tu trabajo previo ya fue commiteado y mergeado a main. Vas a moverte a tu worktree y
continuar desde donde quedaste, ahora aislado.

## Tu task

- Task ID: {{TASK_ID}}

## Pasos exactos — ejecutalos en orden

### 1. Verificar estado del principal

pwd
git -C /Users/martinoficialdegui/Desktop/ambulante branch --show-current
git -C /Users/martinoficialdegui/Desktop/ambulante status --short

Esperado: main, status vacío. Si no → STOP, reportá.

### 2. Verificar que main tenga los merges recientes

git -C /Users/martinoficialdegui/Desktop/ambulante log --oneline -5

Confirmá que estén los commits del trabajo recién mergeado.

### 3. Crear el worktree

git -C /Users/martinoficialdegui/Desktop/ambulante worktree add \
  <DIR_DEL_WORKTREE> \
  -b <BRANCH>

Si tira "fatal: A branch named '...' already exists" → STOP, reportá. No fuerces.

Convención de nombres:
- Dir:    /Users/martinoficialdegui/Desktop/ambulante-<task-id-con-guiones>
- Branch: feat/<task-id-con-guiones>-<slug-corto>

### 4. Moverte al worktree

cd <DIR_DEL_WORKTREE>

### 5. Verificar aislamiento (CRÍTICO)

pwd                        # tu worktree dir
git branch --show-current  # tu branch
git status --short         # vacío
git worktree list          # principal + tuyo

Cualquier valor inesperado → STOP, reportá.

### 6. Instalar dependencias

node_modules/ está en .gitignore — el worktree arranca sin dependencias.

- pnpm-lock.yaml existe → pnpm install
- package-lock.json existe → npm install
- Si tu task no necesita correr código → podés saltar este paso.

### 7. Re-claimear la task en el epic

Editá docs/EPIC-ARCHITECTURE.md y marcá tu task como 🟡 in-progress con timestamp nuevo.
Commit en tu branch:

git add docs/EPIC-ARCHITECTURE.md
git commit -m "chore(epic): re-claim {{TASK_ID}} (post-worktree migration)"

### 8. Continuar el workflow original

Volvé al PASO donde habías quedado. Los archivos del repo son los mismos — solo re-leé
las partes que pudieron cambiar (epic, REGISTRY, archivos a medio editar).

## Reglas para el resto de la ejecución

1. NUNCA cd al principal. Usá git -C /Users/martinoficialdegui/Desktop/ambulante <cmd>.
2. Paths absolutos siempre en Read/Edit/Write.
3. No toques las branches de otros chats.
4. Al terminar la cadena: ver docs/workflows/code-review-protocol.md (PASO 9).

## Empezá ahora

Ejecutá los 8 pasos en orden. Si algo da un valor inesperado, parate y reportá con el
output exacto — no improvises.
```
