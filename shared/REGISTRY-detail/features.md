# REGISTRY-detail — Features existentes

> Componentes y hooks que viven dentro de una feature pero son útiles conocer para no duplicar.
> **Regla:** estos ítems pertenecen a su feature — no importarlos desde otra feature.
> Si dos features necesitan algo del mismo tipo, moverlo a `shared/` y documentarlo allí.

---

## §13 — Inventario por feature

### `features/map/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `useStoresNearbyQuery` | `features/map/hooks/useStoresNearbyQuery.ts` | hook | Query de tiendas activas en radio |
| `useStoreByIdQuery` | `features/map/hooks/useStoreByIdQuery.ts` | hook | Query de tienda por ID |
| `useStoreProductsQuery` | `features/map/hooks/useStoreProductsQuery.ts` | hook | Query de productos de una tienda |
| `StoreDetailSheet` | `features/map/components/StoreDetailSheet/` | componente | Bottom sheet overlay del detalle de tienda |
| `StoreDetailSheetContainer` | `features/map/components/StoreDetailSheet/` | componente | Smart wrapper: carga store + products; renderiza null si no encontrado |

#### StoreDetailSheet (F12.1)
- **Archivos:** `StoreDetailSheet.tsx` (dumb), `StoreDetailSheet.container.tsx` (smart), `StoreDetailSheet.types.ts`
- **API dumb:** `<StoreDetailSheet store products isLoadingProducts onDismiss />`
- **API smart:** `<StoreDetailSheetContainer storeId onDismiss />`
- **Tipos exportados:** `StoreDetailSheetProps`, `StoreDetailSheetContainerProps`
- **Usado en:** `features/map/components/MapScreen.tsx` (condicional sobre `selectedStoreId`)

---

### `features/orders/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `useOrderQuery` | `features/orders/hooks/useOrderQuery.ts` | hook | Query de un pedido por ID |
| `useOrdersQuery` | `features/orders/hooks/useOrdersQuery.ts` | hook | Query de todos los pedidos del usuario |
| `useStoreOrdersQuery` | `features/orders/hooks/useStoreOrdersQuery.ts` | hook | Query de pedidos de una tienda, ordenados por fecha descendente, con invalidación realtime |
| `useNewOrderAlert` | `features/orders/hooks/useNewOrderAlert.ts` | hook | Dispara vibración + tono cuando llegan nuevos pedidos accionables; skips primera renderización |
| `useAcceptOrderMutation` | `features/orders/hooks/useAcceptOrderMutation.ts` | hook | Mutación: tienda acepta pedido |
| `useSendOrderMutation` | `features/orders/hooks/useSendOrderMutation.ts` | hook | Mutación: cliente envía pedido |
| `OrderTracking` | `features/orders/components/OrderTracking/` | componente | Pantalla de seguimiento de pedido en tiempo real |
| `IncomingOrdersInbox` | `features/orders/components/IncomingOrdersInbox/` | componente | Bandeja de pedidos entrantes para la tienda (dumb + container) |

#### IncomingOrdersInbox (F13.4)
- **Archivos:** `IncomingOrdersInbox.tsx` (dumb), `IncomingOrdersInbox.container.tsx` (smart), `IncomingOrdersInbox.types.ts`
- **Descripción:** Bandeja de pedidos entrantes para el rol tienda. Lista todos los pedidos de la tienda ordenados por `createdAt` desc. Muestra botones Aceptar/Rechazar para estado RECIBIDO y Finalizar para EN_CAMINO. Bloquea botones del `pendingOrderId` mientras la mutación está en vuelo.
- **API dumb:** `<IncomingOrdersInbox orders isLoading onAccept onReject onFinalize pendingOrderId />`
- **API smart:** `<IncomingOrdersInboxContainer />` — deriva `storeId` de la sesión; conecta `useStoreOrdersQuery`, `useNewOrderAlert`, y las mutaciones accept/reject/finalize.
- **Hooks asociados:** `useStoreOrdersQuery` (datos + realtime), `useNewOrderAlert` (vibración/audio)
- **Ruta app:** `app/(store)/store/orders/page.tsx`

#### OrderTracking (F12.4)
- **Archivos:** `OrderTracking.tsx` (dumb), `OrderTracking.container.tsx` (smart), `OrderTracking.types.ts`
- **Descripción:** Timeline de 5 pasos (ENVIADO→RECIBIDO→ACEPTADO→EN_CAMINO→FINALIZADO) con `data-testid`, `data-current`, `data-completed`. Estados terminales (CANCELADO/RECHAZADO/EXPIRADO) muestran mensaje en lugar del timeline. CTAs por estado: cancelar (ENVIADO/RECIBIDO), confirmar en camino (ACEPTADO), ninguno (EN_CAMINO/FINALIZADO/terminales).
- **API dumb:** `<OrderTracking order onConfirmOnTheWay onCancel isCancelling isConfirmingOnTheWay />`
- **API smart:** `<OrderTrackingContainer orderId />` — usa `useOrderQuery` + `useRealtimeInvalidation` para invalidación en tiempo real.
- **Tipos exportados:** `OrderTrackingProps`
- **Ruta app:** `app/(client)/orders/[id]/page.tsx`

---

### `features/store-profile/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `useStoreProfileQuery` | `features/store-profile/hooks/useStoreProfileQuery.ts` | hook | Query del perfil de la tienda logueada |
| `useUpdateStoreProfileMutation` | `features/store-profile/hooks/useUpdateStoreProfileMutation.ts` | hook | Mutación: actualiza perfil de tienda |
| `StoreProfilePage` | `features/store-profile/components/StoreProfilePage/` | componente | Página de perfil de tienda (dumb + container) |
| `StoreProfileForm` | `features/store-profile/components/StoreProfileForm/` | componente | Formulario de edición del perfil |

#### store-profile feature completa
- **Componentes:**
  - `StoreProfilePage.tsx` (dumb) — Props: `profile: StoreProfile`, `onSave`, `isSaving: boolean`
  - `StoreProfilePage.container.tsx` (smart, `"use client"`) — conecta `useStoreProfileQuery` + `useUpdateStoreProfileMutation`; maneja loading/error states
  - `StoreProfileForm.tsx` (dumb, `"use client"`) — react-hook-form + `zodResolver(updateStoreProfileSchema)`; campos: `businessName`, `kind` (select), `neighborhood`, `coverageNotes?`, `days` (button toggles), `openTime`/`closeTime` (time inputs en grid)
- **Service:** `storeProfileService` en `features/store-profile/services/store-profile.mock.ts` — interfaz `StoreProfileService` (`getProfile`, `updateProfile`); mock con in-memory state y 300ms de latencia simulada; `MOCK_STORE_ID = "dona-rosa"`
- **Ruta app:** `app/(store)/profile/page.tsx`

---

### `features/store-shell/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `StoreShell` | `features/store-shell/components/StoreShell/StoreShell.tsx` | componente | Shell de layout del rol Tienda (dumb, Server Component compatible) |
| `StoreShellContainer` | `features/store-shell/components/StoreShell/StoreShell.container.tsx` | componente | Smart wrapper: conecta `useUIStore` + `useAvailability` |
| `StoreNav` | `features/store-shell/components/StoreNav/StoreNav.tsx` | componente | Nav con 4 items: Dashboard, Pedidos, Catálogo, Perfil |
| `AvailabilityToggle` | `features/store-shell/components/AvailabilityToggle/AvailabilityToggle.tsx` | componente | Switch accesible de disponibilidad |
| `useAvailability` | `features/store-shell/hooks/useAvailability.ts` | hook | Estado local de disponibilidad: `{ isAvailable, toggle, setAvailable }` |
| `useLocationPublishing` | `features/store-shell/hooks/useLocationPublishing.ts` | hook | Publica la ubicación de la tienda al store; usa `useGeolocation` + `storesService.updateLocation` |

#### Detalle de componentes
- `StoreShell` — Props: `children`, `isAvailable: boolean`, `onToggleAvailability`, `isSidebarOpen: boolean`, `onToggleSidebar`. Layout responsive: bottom bar mobile / sidebar izquierdo desktop (un único DOM tree).
- `StoreNav` — Props: `currentPath?: string` (resalta item activo).
- `AvailabilityToggle` — Props: `isAvailable: boolean`, `onToggle`. `role="switch"`, `aria-checked`.
- **Usado en:** `app/(store)/layout.tsx`

---

### `features/catalog/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `useCatalogQuery` | `features/catalog/hooks/useCatalogQuery.ts` | hook | Query del catálogo CRUD del owner (key: `queryKeys.catalog.byStore`) |
| `useCreateProductMutation` | `features/catalog/hooks/useCreateProductMutation.ts` | hook | Mutación: crea producto; invalida `catalog.byStore` |
| `useUpdateProductMutation` | `features/catalog/hooks/useUpdateProductMutation.ts` | hook | Mutación: actualiza producto; invalida `catalog.byId` + `catalog.byStore` |
| `useDeleteProductMutation` | `features/catalog/hooks/useDeleteProductMutation.ts` | hook | Mutación: elimina producto; invalida `catalog.byStore` |
| `catalogService` | `features/catalog/services/` | service | Interfaz `CatalogService` mock con in-memory state |

---

### `features/admin-audit-log/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `OrderAuditLogContainer` | `features/admin-audit-log/components/OrderAuditLog/` | componente | Página de auditoría de pedidos (smart + dumb) |
| `AuditLogSearch` | `features/admin-audit-log/components/AuditLogSearch/` | componente | Formulario de búsqueda por ID de pedido |
| `TransitionTimeline` | `features/admin-audit-log/components/TransitionTimeline/` | componente | Timeline de transiciones de estado con actor y timestamp |
| `useAuditLogQuery` | `features/admin-audit-log/hooks/useAuditLogQuery.ts` | hook | Query de historial de transiciones por orderId |
| `auditLogService` | `features/admin-audit-log/services/audit-log.mock.ts` | service | Mock service — interfaz `AuditLogService { findByOrderId }` |

#### admin-audit-log feature completa (F14.4)
- **Ruta app:** `app/(admin)/admin/orders/page.tsx`
- **Componentes:**
  - `OrderAuditLog.tsx` (dumb) — Props: `result: AuditLogResult | null`, `isSearching: boolean`, `error: string | null`, `onSearch: (orderId) => void`
  - `OrderAuditLog.container.tsx` (smart, `"use client"`) — conecta `useAuditLogQuery` + estado de búsqueda; extrae mensaje de error
  - `AuditLogSearch.tsx` (dumb, `"use client"`) — react-hook-form + `zodResolver(orderIdSearchSchema)`; campo: `orderId` con validación de min 1 y max 128
  - `TransitionTimeline.tsx` (dumb) — ordena entradas por `occurredAt` ASC; muestra estado, actor, timestamp y eventType; detecta estados terminales con color
- **Schemas:** `auditLogEntrySchema`, `auditLogResultSchema`, `orderIdSearchSchema` en `features/admin-audit-log/schemas/`
- **Tipos:** `AuditLogEntry`, `AuditLogResult`, `OrderIdSearchValues` derivados de los schemas
- **Constantes:** `AUDIT_LOG_MOCK_DELAY_MS`, `AUDIT_LOG_MAX_ORDER_ID_LENGTH`, `AUDIT_LOG_ACTOR_LABEL`, `AUDIT_LOG_STATUS_LABEL`
- **Seed orders (mock):** `order-demo-completed`, `order-demo-rejected`, `order-demo-expired`, `order-demo-cancelled`

---

## Cuándo promover a `shared/`

Un ítem de feature pasa a `shared/` cuando:
1. Otra feature distinta lo necesita.
2. Una nueva feature claramente lo necesitaría (no hipotético — hay una tarea concreta).

Al promover:
1. Moverlo a `shared/` (ruta apropiada según categoría).
2. Actualizar imports en la feature original.
3. Agregarlo al índice rápido de `shared/REGISTRY.md` y al detail file correspondiente.
4. Hacer todo en el mismo commit.
