# PROMPT-TEMPLATE-BACKEND.md — DEPRECADO

> **Este template ya no se usa.** Lo reemplaza el slash command `/b-start <ID>`.

## Cómo arrancar una tarea backend ahora

1. Abrí Claude Code desde el principal:
   ```bash
   cd ~/Desktop/ambulante && claude
   ```
2. Adentro del chat, ejecutá:
   ```
   /b-start <TASK_ID>
   ```
   Ej: `/b-start B7.3`.

`/b-start` hace todo el setup que antes hacía el PASO 0 del template:
- Crea worktree + branch.
- Symlinkea `node_modules` desde el principal (sin `pnpm install`).
- Comparte la instancia de Supabase si ya está corriendo (no levanta una nueva).
- Claimea la tarea en `docs/epic-backend/INDEX.md`.
- Activa el flujo de `docs/workflows/backend-task-protocol.md`, que reemplaza al PASO 1-9 del template.

## Cómo cerrar

```
/b-finish
```

Hace el cierre con code review en 2 pasadas (la 2ª focalizada al diff de fixes), confirma con vos, mergea, borra worktree, y si la tarea tenía `Continues with:`, te imprime el comando para arrancar el siguiente eslabón en chat NUEVO. **No hay auto-continuación de cadenas.**

## Por qué

El template antiguo (414 líneas pegadas como primer mensaje + lectura completa del epic + impresión de tablas de auditoría) consumía ~110K-180K tokens por tarea, y hasta 700K en cadenas. El flujo nuevo apunta a ~25K-40K por tarea.

**No leas este archivo.** Conservado sólo para enlaces históricos.
