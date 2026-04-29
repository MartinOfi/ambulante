# B9-C — Cliente: push subscribe + profile

> **Fase:** B9 — Swap cliente (features Cliente consumen backend real)
> **Goal de la fase:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
> **Acceptance criteria de la fase:** Cliente puede registrarse, ver mapa con tiendas reales, abrir el detalle de una tienda con productos y fotos, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ⚪ pending
- **Por qué:** Cliente opta por recibir notificaciones desde su perfil. Sin este wire, las notifs de B8 (push delivery) no llegan a nadie del lado cliente. Cierre de la fase B9.
- **Entregable:** Flow de opt-in en `features/profile/`: botón "Activar notificaciones" → solicita permiso al browser → suscribe via `PushService.subscribeUser`. Avatar y preferencias básicas del user (nombre visible, idioma).
- **Archivos:** `features/profile/**`.
- **Depends on:** B8.1, B9-A
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:** (se llena al cerrar)
- **Tareas originales fusionadas:** B9.8 (rename — sin fusión).
