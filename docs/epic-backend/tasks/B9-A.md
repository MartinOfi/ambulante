# B9-A — Cliente: onboarding + descubrimiento (auth + landing + map + store detail)

> **Fase:** B9 — Swap cliente (features Cliente consumen backend real)
> **Goal de la fase:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
> **Acceptance criteria de la fase:** Cliente puede registrarse, ver mapa con tiendas reales, abrir el detalle de una tienda con productos y fotos, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ⚪ pending
- **Por qué:** Slice vertical "primer contacto del cliente con el producto": registrarse o loguearse, ver el mapa con tiendas reales y abrir el detalle de una. Es UN flujo desde el punto de vista del usuario — diseñar el auth, las queries de stores nearby y el detalle juntos evita inconsistencias (ej: el `featuredImage` que se decide en el repo de stores tiene que cuadrar con lo que muestra el detalle).
- **Entregable:**
  1. **Auth + landing:** `features/landing/**` y `features/auth/**` (o `app/(auth)/*`) consumen `AuthService` real (login, register, magic link, OAuth). Reemplaza los mocks. Tests unitarios y E2E del flow.
  2. **Mapa + stores nearby:** `features/map/services/stores.mock.ts` reemplazado por `StoresRepository.findNearby(lat, lng, radiusMeters)` con PostGIS `st_dwithin`. Query optimizada con embeddings para traer productos en la misma call (evita N+1). Hooks de `features/map/hooks/**` migrados.
  3. **Store detail + products:** `features/store-detail/**` (o equivalente) consume `StoresRepository.findByPublicId` + `ProductsRepository.findByStore`. Fotos vía `StorageService.getPublicUrl`.
- **Archivos:** `features/landing/**`, `features/auth/**` (o `app/(auth)/*`), `features/map/hooks/**`, `features/map/services/**`, `features/store-detail/**`.
- **Depends on:** B4.4, B3.1, B6.3, B5.2
- **Continues with:** B9-B
- **Skill rules aplicables:** `data-n-plus-one`, `query-index-types`
- **REGISTRY:** `features.md`.
- **Estimación:** XL
- **Notas:** (se llena al cerrar)
- **Tareas originales fusionadas:** B9.1 (swap auth + landing), B9.2 (swap stores nearby + map), B9.3 (swap store detail + products).
