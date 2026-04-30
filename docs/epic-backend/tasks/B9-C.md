# B9-C — Cliente: push subscribe + profile

> **Fase:** B9 — Swap cliente (features Cliente consumen backend real)
> **Goal de la fase:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
> **Acceptance criteria de la fase:** Cliente puede registrarse, ver mapa con tiendas reales, abrir el detalle de una tienda con productos y fotos, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ✅ done [owner: chat-2026-04-29, closed: 2026-04-30]
- **Por qué:** Cliente opta por recibir notificaciones desde su perfil. Sin este wire, las notifs de B8 (push delivery) no llegan a nadie del lado cliente. Cierre de la fase B9.
- **Entregable:** Flow de opt-in en `features/profile/`: botón "Activar notificaciones" → solicita permiso al browser → suscribe via `PushService.subscribeUser`. Avatar y preferencias básicas del user (nombre visible, idioma).
- **Archivos:** `features/profile/**`.
- **Depends on:** B8.1, B9-A
- **Continues with:** —
- **Skill rules aplicables:** —
- **REGISTRY:** `features.md`.
- **Estimación:** M
- **Notas:**
  - **Push opt-in:** hook `usePushSubscribe` (lee `pushService.getPermissionStatus()` al mount + en `visibilitychange`; inicializa `isSubscribed` desde `getActiveSubscription()` para evitar mostrar OFF cuando el browser ya tiene una suscripción activa — riesgo de doble-subscribe). `PushOptInToggle` dumb + container. Real Web Push wiring deferred a B6 (stubs en `push.supabase.ts`); el mock cubre el ciclo completo en tests.
  - **Profile editing:** Server Action `updateProfile` en `features/profile/actions.ts` con Zod (`display_name` min(1) max(50), `avatarUrl` URL o null). `DisplayNameField` + `AvatarUpload` componentes nuevos en `features/profile/components/`. `UpdateUserInput` extendido a `Partial<Omit<User, "id" | "email" | "avatarUrl">> & { avatarUrl?: string | null }` para permitir limpiar avatar (null = clear).
  - **Avatar bucket:** migración `20260429120100_b9c_avatar_url_and_avatars_bucket.sql` agrega `users.avatar_url` + crea bucket `avatars` (público, 5MB, jpg/png/webp) + 4 RLS policies (read libre + insert/update/delete sólo bajo prefix `user-<auth.uid()>/`). `storage.supabase.ts` actualizado con AVATARS en `SIZE_LIMIT_BY_BUCKET` + `ALLOWED_MIME_TYPES_BY_BUCKET` (exhaustive check).
  - **Idioma:** descartado del scope inicial (no es MVP — ver §7.7 del PRD). Si hace falta, se agrega como NT.
  - **PushService interface:** extendida con `getActiveSubscription(): Promise<PushSubscriptionData | null>` (lectura no-destructiva). Implementaciones: mock funcional, supabase stub.
  - **ProfilePage container:** consume hooks via slot pattern (`avatarSlot`, `displayNameEditorSlot`, `pushOptInSlot`) — el dumb component sigue testable y reutilizable.
  - **Code review 2-pass:** PASS final (0 CRITICAL + 0 HIGH); fixes incluidos en commit `refactor(B9-B/B9-C): code review 2-pass fixes`.
  - **Tests:** 44/44 verdes en suites afectadas (`features/profile/`, `shared/services/push.test.ts`). Cobertura ≥80%.
- **Tareas originales fusionadas:** B9.8 (rename — sin fusión).
