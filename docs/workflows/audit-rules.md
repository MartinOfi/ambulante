# Auditoría pre-código — 30 reglas (PASO 3)

Imprimí la tabla COMPLETA en el chat con el status por cada regla — incluso las ✅.
Si hay ❌, reescribí el plan y volvé a auditar desde cero.
**No pasés al PASO 4 hasta tener 0 ❌. Sin excepciones.**

| # | Regla | Status | Violación / Fix |
|---|---|---|---|
| 1 | Sin `any` (§TS) | ✅/❌ | — o "violación X → fix Y" |
| 2 | Sin casts `as` sin justificación | ✅/❌ | ... |
| 3 | Props como `interface` nombrada, no `type Props = {…}` anónimo | ✅/❌ | ... |
| 4 | Props `readonly` cuando aplique (§6.6) | ✅/❌ | ... |
| 5 | Zod en TODOS los boundaries (input user, fetch externo, params URL) | ✅/❌ | ... |
| 6 | Sin magic strings — a `shared/constants/` o `features/x/constants.ts` | ✅/❌ | ... |
| 7 | Sin magic numbers — ídem | ✅/❌ | ... |
| 8 | Sin variables de 1 letra (salvo `i` en for, `e` en handler corto) | ✅/❌ | ... |
| 9 | Código en inglés, UI copy en español | ✅/❌ | ... |
| 10 | Funciones ≤2 params posicionales; si hay 3+ → objeto con interfaz nombrada | ✅/❌ | ... |
| 11 | Funciones ≤50 líneas | ✅/❌ | ... |
| 12 | Una función = una responsabilidad (sin "y"/"and" en el nombre) | ✅/❌ | ... |
| 13 | Componentes con datos/estado → split smart/dumb (`.container.tsx`) | ✅/❌ | ... |
| 14 | Componentes ≤200 líneas; archivos ≤300 (hard 400) | ✅/❌ | ... |
| 15 | Un componente por archivo | ✅/❌ | ... |
| 16 | Server Components por default; `"use client"` solo cuando hace falta | ✅/❌ | ... |
| 17 | Imports con alias `@/shared` / `@/features`; sin `../../../` | ✅/❌ | ... |
| 18 | La feature NO importa de otra feature (§4 aislamiento) | ✅/❌ | ... |
| 19 | Lo reutilizable vive en `shared/` y va al REGISTRY en el mismo commit | ✅/❌ | ... |
| 20 | `catch` loguea con contexto (logger, no `console.log`) | ✅/❌ | ... |
| 21 | Mensajes de error en UI: humanos, en español | ✅/❌ | ... |
| 22 | Inmutabilidad: nunca mutar, siempre `...spread` / `map` / `filter` | ✅/❌ | ... |
| 23 | `const` por default; `let` solo si hay reasignación real | ✅/❌ | ... |
| 24 | Sin comentarios "qué hace"; solo "por qué" cuando no es obvio | ✅/❌ | ... |
| 25 | Respeta máquina de estados del pedido (§7.1 CLAUDE.md) | ✅/❌/N/A | ... |
| 26 | Respeta privacidad ubicación cliente (§7.2) | ✅/❌/N/A | ... |
| 27 | Respeta aislamiento de roles (§7.3) | ✅/❌/N/A | ... |
| 28 | Respeta snapshot de productos (§7.4) | ✅/❌/N/A | ... |
| 29 | Scope check: dentro del §5 del PRD; sin pagos/stock/ratings/chat | ✅/❌ | ... |
| 30 | Sin features/refactors/abstractions/error-handling especulativo que la tarea NO pidió | ✅/❌ | ... |
