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
| `useClusters` | `features/map/hooks/useClusters.ts` | hook | `useMemo` wrapper sobre `computeClusters`; recibe `stores`, `viewState`, `bounds: BBox \| null` |
| `computeClusters` | `features/map/hooks/useClusters.ts` | util | Función pura — carga `supercluster`, retorna `ClusterFeature[]` para un `bbox` + `zoom` |
| `ClusterFeature` | `features/map/hooks/useClusters.ts` | type | Unión discriminada `StorePointProperties \| ClusterProperties` (discriminante: `cluster: boolean`) |
| `ClusterPin` | `features/map/components/ClusterPin.tsx` | componente | Badge circular con count; `onClick` dispara zoom al cluster |
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

### `features/content-moderation/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `useReportsQuery` | `features/content-moderation/hooks/useReportsQuery.ts` | hook | Query de todos los reportes (`queryKeys.reports.all()`) |
| `useRemoveContentMutation` | `features/content-moderation/hooks/useRemoveContentMutation.ts` | hook | Mutación: elimina contenido de un reporte; invalida `reports.all` |
| `useDismissReportMutation` | `features/content-moderation/hooks/useDismissReportMutation.ts` | hook | Mutación: desestima un reporte; invalida `reports.all` |
| `ModerationQueue` | `features/content-moderation/components/ModerationQueue/` | componente | Lista de reportes con cards de acción (dumb + container) |
| `ReportCard` | `features/content-moderation/components/ReportCard/` | componente | Tarjeta de reporte individual con botones de moderar |
| `contentModerationService` | `features/content-moderation/services/content-moderation.mock.ts` | service | Mock con 3 reportes semilla y delay 300ms |

#### content-moderation feature (F14.3)
- **Archivos:** `ReportCard.tsx` (dumb), `ModerationQueue.tsx` (dumb), `ModerationQueue.container.tsx` (smart, `"use client"`)
- **API dumb ModerationQueue:** `<ModerationQueue reports isLoading removingId dismissingId onRemove onDismiss />`
- **API smart:** `<ModerationQueueContainer />` — usa `useReportsQuery` + `useRemoveContentMutation` + `useDismissReportMutation`
- **Constantes:** `REPORT_STATUS` (PENDING/RESOLVED/DISMISSED), `REPORT_REASON` (INAPPROPRIATE/SPAM/MISLEADING/OTHER) en `features/content-moderation/constants.ts`
- **Schema Zod:** `reportSchema` → `Report` type en `features/content-moderation/schemas/content-moderation.schemas.ts`
- **Ruta app:** `app/(admin)/admin/moderation/page.tsx` → `ROUTES.admin.moderation`
- **Nav:** `AdminSidebar` incluye ítem "Moderación" con icono `ShieldAlert`

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

### `features/admin-kpi-dashboard/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `KpiDashboard` | `features/admin-kpi-dashboard/components/KpiDashboard/KpiDashboard.tsx` | componente dumb | Grid 3-col de 6 KpiCards; maneja loading, error y null snapshot |
| `KpiDashboardContainer` | `features/admin-kpi-dashboard/components/KpiDashboard/KpiDashboard.container.tsx` | componente smart | Conecta `useKpiDashboardQuery` y pasa props al dumb |
| `KpiCard` | `features/admin-kpi-dashboard/components/KpiCard/KpiCard.tsx` | componente dumb | Tarjeta de una métrica: label, valor, target opcional, badge de estado |
| `useKpiDashboardQuery` | `features/admin-kpi-dashboard/hooks/useKpiDashboardQuery.ts` | hook | React Query: obtiene `KpiSnapshot`; staleTime 60s, retry false |
| `kpiDashboardService` | `features/admin-kpi-dashboard/services/kpi-dashboard.mock.ts` | service | Singleton mock; valida con `kpiSnapshotSchema`; delay `KPI_MOCK_DELAY_MS` |
| `KpiSnapshot` | `features/admin-kpi-dashboard/types/kpi-dashboard.types.ts` | type | Snapshot de las 6 métricas del PRD §8 con `period` y `computedAt` |
| `KpiDashboardService` | `features/admin-kpi-dashboard/types/kpi-dashboard.types.ts` | interface | `{ fetchKpiSnapshot(): Promise<KpiSnapshot> }` |
| `KPI_TARGETS` | `features/admin-kpi-dashboard/constants/kpi-dashboard.constants.ts` | constant | Umbrales PRD §8: `ACCEPTANCE_RATE_MIN=0.6`, `COMPLETION_RATE_MIN=0.7`, `AVG_RESPONSE_TIME_MAX_MS=180_000`, `EXPIRATION_RATE_MAX=0.15` |

#### admin-kpi-dashboard feature completa (F14.1)
- **Ruta app:** `app/(admin)/admin/dashboard/page.tsx`
- **API dumb:** `<KpiDashboard snapshot isLoading error />`
- **API smart:** `<KpiDashboardContainer />` — sin props
- **6 KPIs:** ordersPerDay, acceptanceRate, completionRate, avgResponseTimeMs, expirationRate, activeStoresConcurrent
- **Formatters internos:** `formatRate` (→ "72%"), `formatResponseTime` (→ "2m 22s"), `rateStatus`, `invertedRateStatus`, `timeStatus`
- **Badge de estado:** `on-target` (verde), `below-target` (rojo), `baseline` (gris)
- **Tests:** 23 tests en 5 archivos

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

### `features/store-validation/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `STORE_VALIDATION_STATUS` | `features/store-validation/constants.ts` | constant | Enum-like object: `pending`, `approved`, `rejected` |
| `REJECTION_REASON_MIN_LENGTH` | `features/store-validation/constants.ts` | constant | Mínimo de caracteres para el motivo de rechazo (10) |
| `REJECTION_REASON_MAX_LENGTH` | `features/store-validation/constants.ts` | constant | Máximo de caracteres para el motivo de rechazo (500) |
| `PendingStore` | `features/store-validation/types/store-validation.types.ts` | type | Tienda en cola de validación (extiende `Store` con `validationStatus` y `rejectionReason?`) |
| `ValidationStatus` | `features/store-validation/types/store-validation.types.ts` | type | Union: `"pending" \| "approved" \| "rejected"` |
| `RejectStoreInput` | `features/store-validation/types/store-validation.types.ts` | type | `{ storeId: string; reason: string }` |
| `rejectStoreSchema` | `features/store-validation/schemas/store-validation.schemas.ts` | schema | Zod schema para el formulario de rechazo; valida longitud del motivo |
| `RejectStoreFormValues` | `features/store-validation/schemas/store-validation.schemas.ts` | type | `z.infer<typeof rejectStoreSchema>` |
| `storeValidationService` | `features/store-validation/services/store-validation.service.mock.ts` | service | Instancia singleton del mock (`getPendingStores`, `getStoreById`, `approveStore`, `rejectStore`) |
| `MockStoreValidationService` | `features/store-validation/services/store-validation.service.mock.ts` | class | Clase del mock con 3 tiendas seed y latencia simulada de 300ms |
| `useStoreValidationQueueQuery` | `features/store-validation/hooks/useStoreValidationQueueQuery.ts` | hook | React Query: lista de tiendas con `validationStatus = "pending"` |
| `useApproveStoreMutation` | `features/store-validation/hooks/useApproveStoreMutation.ts` | hook | Mutación: aprueba una tienda por `storeId`; devuelve `PendingStore` actualizado |
| `useRejectStoreMutation` | `features/store-validation/hooks/useRejectStoreMutation.ts` | hook | Mutación: rechaza una tienda con `{ storeId, reason }`; devuelve `PendingStore` actualizado |
| `StoreValidationQueue` | `features/store-validation/components/StoreValidationQueue/` | componente | Lista de tiendas pendientes (dumb): loading skeleton, empty state, botón por tienda |
| `StoreValidationQueueContainer` | `features/store-validation/components/StoreValidationQueue/` | componente | Smart wrapper: conecta `useStoreValidationQueueQuery`; prop `onSelectStore` |
| `StoreDetailPanel` | `features/store-validation/components/StoreDetailPanel/` | componente | Detalle de tienda pendiente (dumb): foto, nombre, tagline, kind, precio, distancia + botones Aprobar/Rechazar |
| `StoreDetailPanelContainer` | `features/store-validation/components/StoreDetailPanel/` | componente | Smart wrapper: conecta `useApproveStoreMutation` + `useRejectStoreMutation`; gestiona `isRejectDialogOpen`; prop `onActionComplete` |
| `RejectStoreDialog` | `features/store-validation/components/RejectStoreDialog/` | componente | Modal de rechazo (dumb, `role="dialog"`): textarea con validación Zod, botones Confirmar/Cancelar |
| `useValidationDoc` | `features/store-validation/hooks/useValidationDoc.ts` | hook | React Query: cadena `storeValidationService.getValidationDoc` → `storageService.getSignedUrl` para el bucket `validation-docs`. staleTime 55min |
| `ValidationDocViewer` | `features/store-validation/components/ValidationDocViewer/` | componente dumb | Visualiza un doc de validación (PDF→`<iframe>`, image→`<Image unoptimized fill>`); estados loading/error/empty |
| `ValidationDocViewerContainer` | `features/store-validation/components/ValidationDocViewer/` | componente smart | Conecta `useValidationDoc(storeId, docType)` y propaga al dumb |
| `VALIDATION_DOC_TYPES` | `features/store-validation/constants.ts` | constant | Enum-like: `id_front`, `id_back`, `business_proof` |
| `VALIDATION_DOC_TYPE_LABELS` | `features/store-validation/constants.ts` | constant | Labels en español por doc type |
| `ValidationDocType` | `features/store-validation/types/store-validation.types.ts` | type | Union derivado de `VALIDATION_DOC_TYPES` |
| `ValidationDocMeta` | `features/store-validation/types/store-validation.types.ts` | type | `{ path; mimeType; filename }` — metadata por documento |

#### store-validation feature completa (F14.2)

- **Rutas app:**
  - `app/(admin)/admin/stores/page.tsx` — lista de tiendas pendientes; navega a detalle al seleccionar
  - `app/(admin)/admin/stores/[storeId]/page.tsx` — detalle de tienda; redirige a `/admin/stores` tras acción
- **Componentes:**
  - `StoreValidationQueue.tsx` (dumb) — Props: `stores: readonly PendingStore[]`, `isLoading: boolean`, `onSelectStore: (storeId: string) => void`. Renderiza `data-testid="queue-loading"` durante carga, `data-testid="queue-empty"` sin tiendas, y `<button aria-label={store.name}>` por tienda.
  - `StoreValidationQueue.container.tsx` (smart, `"use client"`) — conecta `useStoreValidationQueueQuery`; prop `onSelectStore`.
  - `StoreDetailPanel.tsx` (dumb) — Props: `store`, `isApproving`, `isRejecting`, `onApprove`, `onReject`. Botones con `aria-label="Aprobar tienda"` / `"Rechazar tienda"`, deshabilitados cuando `isBusy`.
  - `StoreDetailPanel.container.tsx` (smart, `"use client"`) — encuentra tienda en la cola por `storeId`; renderiza `data-testid="store-not-found"` si no existe; gestiona `isRejectDialogOpen` con `useState`; llama mutaciones con `onSuccess: onActionComplete`.
  - `RejectStoreDialog.tsx` (dumb, `"use client"`) — `react-hook-form` + `zodResolver(rejectStoreSchema)`; devuelve `null` cuando `open=false`; `<div role="dialog" aria-modal="true">`; textarea con `id="rejection-reason"`.
- **Service:** `storeValidationService` en `features/store-validation/services/store-validation.service.mock.ts`; interfaz `StoreValidationService` con 5 métodos (`getPendingStores`, `getStoreById`, `approveStore`, `rejectStore`, `getValidationDoc`); 3 tiendas seed con `documents` por doc type; latencia simulada 300ms.
- **Sidebar:** `features/admin-shell/components/AdminSidebar/AdminSidebar.tsx` incluye nav item "Validación de tiendas" → `ROUTES.admin.stores`.
- **Documentos de validación (B5.4):** El `StoreDetailPanel` acepta un `validationDocsSlot?: ReactNode` — el container inyecta 3 `ValidationDocViewerContainer` (uno por `VALIDATION_DOC_TYPES`). El hook `useValidationDoc` encadena la metadata del service mock con `storageService.getSignedUrl` (bucket `validation-docs`, expiresIn 1h, staleTime 55min). El dumb viewer ramifica entre PDF (`<iframe>`) e imagen (`<Image unoptimized fill>`) según `mimeType`.
- **Tests:** 60 tests en 12 archivos (service 13, hooks 11, components 36).

---

### `features/user-management/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `UserManagementPage` | `features/user-management/components/UserManagementPage/UserManagementPage.tsx` | componente dumb | Página de gestión: filtros (rol/estado/búsqueda) + listado + diálogo de suspensión con motivo |
| `UserManagementPageContainer` | `features/user-management/components/UserManagementPage/UserManagementPage.container.tsx` | componente smart | Conecta `useUsersQuery`, mutations de Server Actions, `useUserManagementFilters` (URL state via nuqs), búsqueda client-side por email/nombre |
| `UserDetailPage` | `features/user-management/components/UserDetailPage/UserDetailPage.tsx` | componente dumb | Vista de detalle: encabezado del usuario + acciones (suspend/reactivate) + tabla de orders |
| `UserDetailPageContainer` | `features/user-management/components/UserDetailPage/UserDetailPage.container.tsx` | componente smart | Conecta `useUserDetailQuery` + mutations + navegación con `useRouter` |
| `UserTable` | `features/user-management/components/UserTable/UserTable.tsx` | componente dumb | Tabla con badges, acción "Ver" (detail), suspend/reactivate. Admin no se puede suspender |
| `UserOrdersTable` | `features/user-management/components/UserOrdersTable/UserOrdersTable.tsx` | componente dumb | Tabla de pedidos del usuario en su detail; badge por status, total ARS, fecha en es-AR |
| `UserFiltersBar` | `features/user-management/components/UserFiltersBar/UserFiltersBar.tsx` | componente dumb | Search input + selects de rol/estado; tipos `RoleFilter` / `StatusFilter` con sentinel `"all"` |
| `SuspendConfirmDialog` | `features/user-management/components/SuspendConfirmDialog/SuspendConfirmDialog.tsx` | componente dumb | Modal con textarea de motivo (min 3 chars). Confirm deshabilitado hasta motivo válido |
| `useUsersQuery` | `features/user-management/hooks/useUsersQuery.ts` | hook | Lista usuarios vía React Query con filtros `role`/`status`; key incluye filtros |
| `useUserDetailQuery` | `features/user-management/hooks/useUserDetailQuery.ts` | hook | Trae user + orders del usuario; key: `queryKeys.users.byId(userId)` |
| `useSuspendUserMutation` | `features/user-management/hooks/useSuspendUserMutation.ts` | hook | Llama `suspendUserAction` con `{userId, reason}`; invalida `users.all()` y `users.byId()` |
| `useReactivateUserMutation` | `features/user-management/hooks/useReactivateUserMutation.ts` | hook | Llama `reactivateUserAction(userId)`; invalida ambas keys |
| `useUserManagementFilters` | `features/user-management/hooks/useUserManagementFilters.ts` | hook | URL state con `nuqs` para `role`, `status`, `q`. Sentinel `"all"` se serializa como `null` |
| `suspendUserAction` / `reactivateUserAction` | `features/user-management/server-actions/user-management-actions.ts` | server-action | `"use server"`. Gate por `is_admin()` RPC. Instancian `SupabaseUserRepository` + `SupabaseOrderRepository` (route handler client). Devuelven `UserManagementActionResult` |
| `createUserManagementService` | `features/user-management/services/userManagement.service.ts` | service factory | `listUsers(role/status)`, `getUserDetail(userId)`, `suspendUser({userId, reason})`, `reactivateUser({userId})`. Aplica state machine `assertCanSuspend`/`assertCanReactivate` |
| `getUserManagementService` | `features/user-management/services/userManagement.factory.ts` | factory client-only | Singleton browser-side: instancia `SupabaseUserRepository` + `SupabaseOrderRepository` con `createBrowserClient()` |

#### Detalle de componentes
- `UserManagementPage` — Props extendidas con filtros (`roleFilter`, `statusFilter`, `searchQuery`), `suspendReason`, `suspendErrorMessage` y handlers de filtros + view + reason change
- `UserDetailPage` — Props con `user | null`, `orders`, error/loading + handlers de suspend/reactivate/back
- `UserTable` — Props: `users`, `pendingUserId`, `onSuspend`, `onReactivate`, `onView`. Admin: botón Suspender disabled
- `UserOrdersTable` — Props: `orders`. Empty state si no hay pedidos. Badge por status con `statusVariant()` interno
- `UserFiltersBar` — Props: filtros + handlers. Sentinel `"all"` para "sin filtro"
- `SuspendConfirmDialog` — Props ahora incluyen `reason`, `errorMessage`, `onReasonChange`. Confirma sólo si `reason.trim().length >= 3`
- **Usado en:** `app/(admin)/admin/users/page.tsx`, `app/(admin)/admin/users/[userId]/page.tsx`

#### State machine + portabilidad
- State machine **TS-only** sobre `users.suspended` (boolean) — no requiere migración SQL. Estados: `SUSPENSION_STATUS.ACTIVE` / `SUSPENSION_STATUS.SUSPENDED`
- `assertCanSuspend(user)` rechaza si ya está suspendido o si rol es admin (`isProtectedRole`)
- `assertCanReactivate(user)` rechaza si no está suspendido
- Server Actions usan `createRouteHandlerClient` (no `createServerClient`) porque las cookies son writable en Server Actions, igual que en Route Handlers
- `reason` del suspend se loguea en server-side logger (futuro: B11-B audit log lo persiste)

---

### `features/store-analytics/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `StoreAnalyticsDashboard` | `features/store-analytics/components/StoreAnalyticsDashboard/StoreAnalyticsDashboard.tsx` | componente dumb | Dashboard de KPIs con selector de período (1/7/30 días) y grilla de 6 KpiCards |
| `StoreAnalyticsDashboardContainer` | `features/store-analytics/components/StoreAnalyticsDashboard/StoreAnalyticsDashboard.container.tsx` | componente smart | Conecta `useCurrentStoreQuery` + `useStoreKpiQuery`; gestiona loading/error en español |
| `KpiCard` | `features/store-analytics/components/KpiCard/KpiCard.tsx` | componente dumb | Tarjeta de KPI individual: label, valor formateado, descripción, target opcional y badge de status |
| `KpiStatus` | `features/store-analytics/components/KpiCard/KpiCard.types.ts` | type | Union: `"success" \| "warning" \| "danger" \| "neutral"` |
| `KpiCardProps` | `features/store-analytics/components/KpiCard/KpiCard.types.ts` | type | Props de `KpiCard`: `label`, `value`, `description`, `status`, `target?` |
| `useStoreKpiQuery` | `features/store-analytics/hooks/useStoreKpiQuery.ts` | hook | React Query + estado de período; retorna `{ data, isLoading, isError, period, setPeriod }` |
| `storeAnalyticsService` | `features/store-analytics/services/store-analytics.service.ts` | service | Singleton del mock; interfaz `StoreAnalyticsService { getKpiSummary(filter) }` |
| `createMockStoreAnalyticsService` | `features/store-analytics/services/store-analytics.service.ts` | service factory | Crea mock con valores deterministas por `storeId` (hash estable, sin `Math.random()`) |
| `StoreKpiSummary` | `features/store-analytics/types/store-analytics.types.ts` | type | Los 6 KPIs: `ordersTotal`, `ordersPerDay`, `acceptanceRate`, `finalizationRate`, `avgResponseMs`, `expirationRate`, `activeDaysCount` |
| `AnalyticsPeriod` | `features/store-analytics/types/store-analytics.types.ts` | type | Union: `1 \| 7 \| 30` (días) |
| `StoreAnalyticsFilter` | `features/store-analytics/types/store-analytics.types.ts` | type | `{ storeId: string; period: AnalyticsPeriod }` |
| `analyticsPeriodSchema` | `features/store-analytics/schemas/store-analytics.schemas.ts` | schema | Zod: `z.union([z.literal(1), z.literal(7), z.literal(30)])` |
| `storeKpiSummarySchema` | `features/store-analytics/schemas/store-analytics.schemas.ts` | schema | Zod: objeto con todos los campos de `StoreKpiSummary` con rangos validados |

#### store-analytics feature completa (F13.7)

- **Ruta app:** `app/(store)/store/analytics/page.tsx` — Server Component; renderiza `<StoreAnalyticsDashboardContainer />`
- **Acceso:** link "Métricas" en `StoreDashboard` quick links (`BarChart2` icon)
- **KPIs y targets:**
  - `pedidos/día` → neutral (informativo)
  - `tasa aceptación` → success ≥60%, warning ≥40%, danger <40%
  - `tasa finalización` → success ≥70%, warning ≥50%, danger <50%
  - `tiempo respuesta` → success ≤3min, warning ≤5min, danger >5min (lowerIsBetter)
  - `tasa expiración` → success ≤15%, warning ≤25%, danger >25% (lowerIsBetter)
  - `días activos` → neutral (informativo)
- **Formato:** `formatRate(0.72)` → "72%", `formatResponseTime(120000)` → "2 min"
- **Helpers internos:** `rateStatus(value, target, higherIsBetter)` → `KpiStatus`; `stableHash(storeId)` → número determinista para mock data
- **Tests:** 20 tests (service 8, KpiCard 6, StoreAnalyticsDashboard 6)

---

### `features/admin-observability/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `SlowQueriesPanel` | `features/admin-observability/components/SlowQueriesPanel/SlowQueriesPanel.tsx` | componente dumb | Tabla de top queries lentas: rank, media (ms), llamadas, total (ms), query truncada |
| `SlowQueriesPanelContainer` | `features/admin-observability/components/SlowQueriesPanel/SlowQueriesPanel.container.tsx` | componente smart | Conecta `useSlowQueriesQuery`; propaga isLoading + mensaje de error |
| `useSlowQueriesQuery` | `features/admin-observability/hooks/useSlowQueriesQuery.ts` | hook | React Query: GET `/api/admin/slow-queries`; staleTime 60s |
| `SLOW_QUERIES_LIMIT` | `features/admin-observability/constants/admin-observability.constants.ts` | constant | Número máximo de queries a mostrar (20) |
| `SLOW_QUERIES_STALE_TIME_MS` | `features/admin-observability/constants/admin-observability.constants.ts` | constant | staleTime de la query (60 000 ms) |
| `QUERY_TRUNCATE_LENGTH` | `features/admin-observability/constants/admin-observability.constants.ts` | constant | Longitud máxima de texto de query a mostrar (120 chars) |

#### admin-observability feature completa (B12.1)
- **Ruta app:** pendiente (conectar desde `app/(admin)/admin/...`)
- **API dumb:** `<SlowQueriesPanel queries isLoading error />`
- **API smart:** `<SlowQueriesPanelContainer />` — sin props
- **Route Handler:** `GET /api/admin/slow-queries` — auth + `is_admin()` RPC + `get_top_slow_queries()` RPC; responde `{ data: SlowQuery[] }`
- **SQL:** `supabase/migrations/20260428000007_get_top_slow_queries_fn.sql` — SECURITY DEFINER function; `is_admin()` guard interno; lee `pg_stat_statements` ordenado por `mean_exec_time desc`
- **Tipo compartido:** `SlowQuery` + `slowQuerySchema` en `shared/types/observability.ts`
- **Tests:** 15 tests en 2 archivos (route handler 7, SlowQueriesPanel 8)

---

### `features/store-onboarding/`

| Nombre | Ruta | Tipo | Descripción |
|---|---|---|---|
| `submitStoreOnboarding` | `features/store-onboarding/services/submit-store-onboarding.ts` | service fn | Lógica de dominio del onboarding: valida usuario, rol, suspensión, datos Zod y crea la tienda |
| `SubmitStoreOnboardingDeps` | `features/store-onboarding/services/submit-store-onboarding.ts` | interface | Deps inyectadas: `getCurrentUser`, `createStore`, `generateStoreId` |
| `SubmitStoreOnboardingResult` | `features/store-onboarding/services/submit-store-onboarding.ts` | type | Union discriminada: `{ success: true; storeId }` \| `{ success: false; error }` |
| `submitStoreOnboardingAction` | `features/store-onboarding/server-actions/store-onboarding-actions.ts` | server-action | `"use server"`. Crea session + service-role clients, cablea deps reales, llama `submitStoreOnboarding` |
| `storeOnboardingSchema` | `features/store-onboarding/schemas/store-onboarding.schemas.ts` | schema | Zod: valida el formulario multi-step de alta de tienda (CUIT 11 dígitos con módulo 11) |
| `StoreOnboardingData` | `features/store-onboarding/schemas/store-onboarding.schemas.ts` | type | `z.infer<typeof storeOnboardingSchema>` — campos: `businessName`, `kind`, `cuit`, `neighborhood`, `coverageNotes?`, `days`, `openTime`, `closeTime` |

#### store-onboarding service (B10-A.2)
- **Patrón DI:** `submitStoreOnboarding(data, deps)` — toda la lógica de dominio sin acoplamiento a Supabase; testeable con mocks.
- **Flujo de guards:** unauthenticated → wrong role → suspended → Zod parse → `createStore` → return `storeId`.
- **Persistencia:** la tienda se crea con `status="closed"` (invisible hasta aprobación) y `cuit` almacenado para la cola de validación admin.
- **Server Action:** usa dos clientes Supabase distintos — session client (anon key + cookies) para leer el usuario, service role client para el INSERT que bypasea las RLS policies de `stores` (sin INSERT policy para el rol autenticado).
- **Tests:** 11 tests en `submit-store-onboarding.test.ts`.

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
