# Protocolo de deuda técnica (PASO 7)

Al terminar cada tarea, revisá si quedó algo diferido intencionalmente. Usá esta tabla para decidir qué hacer con cada ítem:

| Situación | Acción |
|---|---|
| El fix tiene ≥50% implementable **ahora** sin romper nada | Implementalo en esta misma tarea. Anotá en `docs/EPIC-ARCHITECTURE.md § Deuda técnica` la parte pendiente con referencia a dónde completarla. |
| El fix depende **completamente** de algo que no existe todavía | No es deuda: es un **requisito** de la tarea futura. Anotalo en el campo `Notas:` de esa tarea en el epic — no en la sección de deuda. |
| El fix cambia el contrato de algo **ya existente** o requiere migración | Anotalo en `docs/EPIC-ARCHITECTURE.md § Deuda técnica` con ID `DT-N` y agregá `Resuelve: DT-N` en la tarea futura que lo cierra. |

**Regla de oro:** la sección `## Deuda técnica` del epic es para cosas que *existen pero están incompletas*. Si la base todavía no existe, va en la tarea que la construye — no en deuda.
