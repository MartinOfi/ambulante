# Changelog del epic backend

| Fecha | Cambio |
|---|---|
| 2026-04-21 | Creación del epic backend (EPIC-BACKEND.md) a partir del brainstorming documentado en la conversación: shape 3 validado contra skill supabase-postgres-best-practices, 9 incorporaciones de la skill, 15 fases, ~75 tareas. |
| 2026-04-28 | B5.1 iniciada: crear buckets + RLS de Storage. |
| 2026-04-28 | B5.1 cerrada: 3 buckets + 13 RLS policies. Fixes: search_path, stores_view security_invoker, duplicate timestamps. |
| 2026-04-29 | **Re-shape vertical del epic.** Las 32 tareas pendientes de B7/B9/B10/B11/B12/B13 se fusionaron en 14 tareas verticales por feature (slice por feature, no por capa). Pendientes pasaron de 38 a 21 (-45%). Tareas originales archivadas en `tasks/_archived/`. Done preservado intacto. Motivación: tareas chicas con bookkeeping pesado (5 archivos de meta por 2 de código real); fusiones agrupan flows que se rompían entre sí cuando se diseñaban separados. Nuevas: B7-A, B9-A/B/C, B10-A/B/C/D, B11-A/B/C, B12-A, B13-A/B. |
