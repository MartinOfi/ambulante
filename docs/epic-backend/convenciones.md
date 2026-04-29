# Convenciones del epic backend

> Aplican a TODAS las tareas. Leé esto sólo si tu tarea toca SQL/RLS/migraciones.

### IDs y nombres

- **Task IDs:** prefijo `B` para todo el epic de backend. Formato `Bx.y` (ej: `B0.1`, `B2.3`, `B12.4`). Nunca colisiona con los `F*` del frontend epic.
- **Branches:** `feat/b<task-id>-<slug>` (ej: `feat/b1-2-core-tables`).
- **Worktrees:** `../ambulante-b<task-id>` (ej: `../ambulante-b1-2`).
- **Cadenas:** prefijo `C-B*`.

### Convenciones SQL (tomadas de `supabase-postgres-best-practices`)

Estas seis reglas son **invariantes del epic** — cualquier tarea que escriba SQL debe respetarlas. El código review rechaza PRs que las violen.

| # | Regla | Rule de la skill que la respalda | Verificación |
|---|---|---|---|
| 1 | `snake_case` lowercase para tablas, columnas, índices, constraints, funciones. Prohibido mixed-case / comillas dobles. | `schema-lowercase-identifiers` | PR review |
| 2 | Primary keys `bigint generated always as identity` por default. UUIDv7 solo para IDs expuestos al cliente con justificación documentada. Nunca `serial`. Nunca `uuid_generate_v4()` como PK. | `schema-primary-keys` | PR review + test automatizado (B1.5) |
| 3 | Toda FK con índice explícito en la misma migración que la crea. | `schema-foreign-key-indexes` | Test CI en B1.5 (query contra `pg_constraint`/`pg_index`, fail si hay FK sin índice) |
| 4 | RLS policies usan `(select auth.uid())`, nunca `auth.uid()` directo. | `security-rls-performance` | Lint SQL en B2.5 |
| 5 | Transacciones cortas, sin I/O externo dentro. Efectos secundarios (push, emails, webhooks) via domain events post-commit. | `lock-short-transactions` | PR review |
| 6 | Jobs que reclaman filas de una queue (cron expirations, push retries) usan `FOR UPDATE SKIP LOCKED`. | `lock-skip-locked` | PR review + test concurrente (B7.5) |

### Formato de bloque de tarea

```
### Bx.y — Título corto
- **Estado:** ⚪ pending
- **Por qué:** 1-2 líneas de motivo.
- **Entregable:** lo que queda al terminar (archivos, migraciones, tests).
- **Archivos:** paths absolutos o relativos al repo.
- **Depends on:** IDs de tareas (o "—").
- **Continues with:** ID de la siguiente tarea en la cadena (o "—").
- **Skill rules aplicables:** nombres de rules del directorio references/ de la skill.
- **REGISTRY:** qué detail files de shared/REGISTRY-detail/ hay que actualizar (o "—" si no toca shared/).
- **Estimación:** S/M/L/XL.
- **Notas:** (se llenan al cerrar)
```

---
