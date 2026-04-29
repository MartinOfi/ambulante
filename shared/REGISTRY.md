# Shared Registry — Orchestrador

> **Regla de oro:** antes de crear cualquier componente, hook, util, service, constante o tipo nuevo, consultá este archivo. Si ya existe → reutilizalo o extendelo. Si creás algo nuevo → actualizá el detail file correspondiente en `shared/REGISTRY-detail/` **en el mismo commit**.

---

## Paso 1 — Routing por categoría

| Estoy buscando... | Ir a |
|---|---|
| Componentes UI primitivos (Button, Input, Form, Card...) o compuestos (Icon, Text, LiveMiniMap, layout primitives) o providers (QueryProvider, NuqsProvider) | [`REGISTRY-detail/ui.md`](./REGISTRY-detail/ui.md) |
| Data layer: query keys, hooks de datos, services, repositories, offline queue | [`REGISTRY-detail/data.md`](./REGISTRY-detail/data.md) |
| Domain: tipos TS, schemas Zod, state machine, domain events, constantes, routes | [`REGISTRY-detail/domain.md`](./REGISTRY-detail/domain.md) |
| Infraestructura: utils puros, design tokens, config de entorno, stores Zustand | [`REGISTRY-detail/infra.md`](./REGISTRY-detail/infra.md) |
| Componentes/hooks de features existentes (OrderTracking, StoreDetailSheet, store-shell) | [`REGISTRY-detail/features.md`](./REGISTRY-detail/features.md) |
| Test utilities (renderWithProviders, factories de entidades) o pgTAP RLS tests (`supabase/tests/`) | [`REGISTRY-detail/testing.md`](./REGISTRY-detail/testing.md) |

---

## Paso 2 — Índice rápido por nombre

| Nombre | Tipo | Ruta | Detail |
|---|---|---|---|
| ANALYTICS_EVENT / analyticsEventSchemas / AnalyticsEventMap | constant | `shared/constants/analytics-events.ts` | data.md §4 |
| analyticsService / createAnalyticsService / AnalyticsTransport | service | `shared/services/analytics.ts` | data.md §4 |
| kpiService / createKpiService / KpiService / computeDeltaMs | service | `shared/services/kpi.ts` | data.md §4 |
| KpiCard | feature-component | `features/store-analytics/components/KpiCard/` | features.md §13 |
| KpiStatus / KpiCardProps | type | `features/store-analytics/components/KpiCard/KpiCard.types.ts` | features.md §13 |
| AuditLogEntry / NewAuditLogEntry | type | `shared/domain/audit-log.ts` | domain.md §12 |
| auditLogEntrySchema / newAuditLogEntrySchema | schema | `shared/domain/audit-log.ts` | domain.md §12 |
| auditLogService / createMockAuditLogService / AuditLogService | service | `shared/services/audit-log.ts` | data.md §4 |
| authService | service | `shared/services/auth.ts` | data.md §4 |
| authService / realtimeService / pushService / storageService (env factory) | factory | `shared/services/index.ts` | data.md §5 |
| supabaseAuthService / createAuthClient | service-stub | `shared/services/auth.supabase.ts` | data.md §5 |
| supabaseRealtimeService / createRealtimeClient | service-stub | `shared/services/realtime.supabase.ts` | data.md §5 |
| supabasePushService / createPushClient / createServerPushSender / getServerPushSender | service-stub + server-sender | `shared/services/push.supabase.ts` | data.md §5 |
| ServerPushSender / PushNotificationPayload | type | `shared/services/push.types.ts` | data.md §5 |
| createPushOnStatusChangeListener / PushListener | domain-listener | `shared/domain/events/listeners/push-on-status-change.ts` | domain.md §12 |
| supabaseStorageService / createSupabaseStorageService / SupabaseStorageBucket / SupabaseStorageClient | service | `shared/services/storage.supabase.ts` | data.md §5 |
| storageService | service | `shared/services/storage.ts` | data.md §4 |
| StorageService / UploadParams / RemoveParams / GetPublicUrlParams / GetSignedUrlParams / StorageResult / UploadResult | type | `shared/services/storage.types.ts` | data.md §4 |
| STORAGE_BUCKETS / StorageBucket / STORAGE_SIZE_LIMITS / STORAGE_ALLOWED_MIME_TYPES / MOCK_STORAGE_BASE_URL | constant | `shared/constants/storage.ts` | domain.md §8 |
| storage_buckets migration (products / store-logos / validation-docs) + RLS policies | sql-migration | `supabase/migrations/20260428000006_storage_buckets.sql` | domain.md §17 |
| Badge | ui-component | `shared/components/ui/badge.tsx` | ui.md §1 |
| Button | ui-component | `shared/components/ui/button.tsx` | ui.md §1 |
| Card | ui-component | `shared/components/ui/card.tsx` | ui.md §1 |
| CACHE_REVALIDATION_SECONDS / CACHE_TAGS / HTTP_CACHE_CONTROL / CacheTag | constant | `shared/config/cache-config.ts` | infra.md §9b |
| cn | util | `shared/utils/cn.ts` | infra.md §5 |
| catalogService | service | `features/catalog/services/` | features.md §13 |
| computeRetryDelay | util | `shared/providers/QueryProvider.tsx` | ui.md §2c |
| Container | ui-component | `shared/components/layout/` | ui.md §2 |
| contrastRatio / hslToLuminance / WCAG_THRESHOLDS | util | `shared/styles/contrast.ts` | infra.md §6 |
| Coordinates | type | `shared/types/coordinates.ts` | domain.md §7 |
| coordinatesSchema | schema | `shared/schemas/coordinates.ts` | domain.md §7b |
| createEventBus / eventBus | domain | `shared/domain/event-bus.ts` | domain.md §12 |
| current_user_id / current_store_id / is_admin | sql-fn | `supabase/migrations/20260428000000_rls_policies.sql` | domain.md §14 |
| createLogger | util | `shared/utils/logger.ts` | infra.md §5 |
| createMockPushService | service | `shared/services/push.ts` | data.md §4 |
| createMockRealtimeService | service | `shared/services/realtime.ts` | data.md §4 |
| createMockStoreAnalyticsService | service | `features/store-analytics/services/store-analytics.service.ts` | features.md §13 |
| createSetTimeoutScheduler | domain | `shared/domain/timeouts.ts` | domain.md §12 |
| createTestQueryClient | test-util | `shared/test-utils/render.tsx` | testing.md §14 |
| createOrder / createUser / createStore / createOrderItem | test-util | `shared/test-utils/factories.ts` | testing.md §14 |
| dequeueAll | query | `shared/query/offline-queue.ts` | data.md §2b |
| Divider | ui-component | `shared/components/layout/` | ui.md §2 |
| enqueueItem | query | `shared/query/offline-queue.ts` | data.md §2b |
| env / parseEnv | config | `shared/config/env.ts` | infra.md §9 |
| extractErrorMessage | util | `shared/utils/errorMessage.ts` | infra.md §5 |
| FLAG_KEYS / FlagKey / FLAG_DEFAULTS | constant | `shared/constants/flags.ts` | infra.md §8b |
| flagsService | service | `shared/services/flags.ts` | infra.md §8b |
| FlagsProvider / useFlagsContext | provider | `shared/providers/FlagsProvider.tsx` | infra.md §8b |
| useFlag | hook | `shared/hooks/useFlag.ts` | infra.md §8b |
| FM_DURATIONS / FM_EASINGS / TRANSITIONS / FADE_IN_VARIANTS | util | `shared/styles/motion.ts` | infra.md §6 |
| Form / FormField / FormItem / FormLabel | ui-component | `shared/components/ui/form.tsx` | ui.md §1 |
| formatDistance / formatPrice | util | `shared/utils/format.ts` | infra.md §5 |
| getClientLocationForStore / LocationAccessError / LocationAccessResult / RequesterRole | domain | `shared/domain/client-location-access.ts` | domain.md §12 |
| getRequiredRole | util | `shared/utils/route-access.ts` | infra.md §5 |
| Icon | ui-component | `shared/components/Icon/` | ui.md §2 |
| Input | ui-component | `shared/components/ui/input.tsx` | ui.md §1 |
| InstallPrompt / InstallPromptContainer | ui-component | `shared/components/InstallPrompt/` | ui.md §2 |
| ServiceWorkerUpdateBanner / ServiceWorkerUpdateBannerContainer | ui-component | `shared/components/ServiceWorkerUpdateBanner/` | ui.md §2 |
| isClientError | util | `shared/providers/QueryProvider.tsx` | ui.md §2c |
| Label | ui-component | `shared/components/ui/label.tsx` | ui.md §1 |
| LOCALE / SupportedLocale | constant | `shared/constants/i18n.ts` | domain.md §8 |
| LiveMiniMap | ui-component | `shared/components/LiveMiniMap/` | ui.md §2 |
| logger | util | `shared/utils/logger.ts` | infra.md §5 |
| NavigationMenu | ui-component | `shared/components/ui/navigation-menu.tsx` | ui.md §1 |
| NuqsProvider | provider | `shared/providers/NuqsProvider.tsx` | ui.md §2c |
| OrderTracking / OrderTrackingContainer | feature-component | `features/orders/components/OrderTracking/` | features.md §13 |
| offlineQueueItemSchema / sendOrderPayloadSchema | schema | `shared/query/offline-queue.ts` | data.md §2b |
| ORDER_DOMAIN_EVENT / serializeEvent | domain | `shared/domain/events.ts` | domain.md §12 |
| ORDER_STATUS / TERMINAL_ORDER_STATUSES | constant | `shared/constants/order.ts` | domain.md §8 |
| ORDER_TIMEOUT_POLICIES | domain | `shared/domain/timeouts.ts` | domain.md §12 |
| internal.call_cron_endpoint / expire-orders / auto-close-orders | sql-scheduled-job | `supabase/migrations/20260428000000_schedule_crons.sql` | domain.md §14 |
| orderRepository | repository | `shared/repositories/order.ts` | data.md §11 |
| orderSchema | schema | `shared/schemas/order.ts` | domain.md §7b |
| parseResponse / ParseError | query | `shared/query/parseResponse.ts` | data.md §2b |
| parseSessionCookie / serializeSessionCookie / writeSessionCookie / clearSessionCookie | util ⚠️ superseded B4.2 | `shared/utils/session-cookie.ts` | infra.md §5 |
| createBrowserClient / createServerClient / createRouteHandlerClient / createMiddlewareClient | supabase-client | `shared/repositories/supabase/client.ts` | data.md §6 |
| Popover | ui-component | `shared/components/ui/popover.tsx` | ui.md §1 |
| productRepository | repository | `shared/repositories/product.ts` | data.md §11 |
| Product | type | `shared/types/product.ts` | domain.md §7 |
| productSchema | schema | `shared/schemas/product.ts` | domain.md §7b |
| ProductSnapshot / snapshot | domain | `shared/domain/product-snapshot.ts` | domain.md §7c |
| productsService | service | `shared/services/products.ts` | data.md §4 |
| POST /api/push/subscribe | route-handler | `app/api/push/subscribe/route.ts` | infra.md §13 |
| DELETE /api/push/unsubscribe | route-handler | `app/api/push/unsubscribe/route.ts` | infra.md §13 |
| pushService | service | `shared/services/push.ts` | data.md §4 |
| QueryProvider | provider | `shared/providers/QueryProvider.tsx` | ui.md §2c |
| queryKeys | query | `shared/query/keys.ts` | data.md §2b |
| RadialOrbitalTimeline | ui-component | `shared/components/ui/radial-orbital-timeline.tsx` | ui.md §1 |
| RADIUS_OPTIONS / RadiusValue / DEFAULT_RADIUS | constant | `shared/constants/radius.ts` | domain.md §8 |
| RATE_LIMIT_RULES / RateLimitRule / RateLimitRouteGroup | constant | `shared/constants/rate-limit.ts` | infra.md §12 |
| createRateLimitService / InMemoryRateLimiter / RateLimitService / RateLimitResult | service | `shared/services/rate-limit.ts` | infra.md §12 |
| REALTIME_CHANNELS | constant | `shared/constants/realtime.ts` | domain.md §8 |
| RECONNECT_INITIAL_DELAY_MS (y otros) | constant | `shared/constants/realtime.ts` | domain.md §8 |
| realtimeService | service | `shared/services/realtime.ts` | data.md §4 |
| registerBackgroundSync | query | `shared/query/offline-queue.ts` | data.md §2b |
| renderWithProviders | test-util | `shared/test-utils/render.tsx` | testing.md §14 |
| no-raw-img (invariant test) | fitness-fn | `shared/test-utils/no-raw-img.test.ts` | testing.md §14 |
| rls_users (pgTAP) | pgtap-test | `supabase/tests/rls_users.sql` | testing.md §15 |
| rls_stores (pgTAP) | pgtap-test | `supabase/tests/rls_stores.sql` | testing.md §15 |
| rls_products (pgTAP) | pgtap-test | `supabase/tests/rls_products.sql` | testing.md §15 |
| rls_orders (pgTAP) | pgtap-test | `supabase/tests/rls_orders.sql` | testing.md §15 |
| rls_audit_log (pgTAP) | pgtap-test | `supabase/tests/rls_audit_log.sql` | testing.md §15 |
| ROUTES / Route / buildHref | constant | `shared/constants/routes.ts` | domain.md §8 |
| Row | ui-component | `shared/components/layout/` | ui.md §2 |
| Screen | ui-component | `shared/components/layout/` | ui.md §2 |
| SectionHeader | ui-component | `shared/components/typography/SectionHeader.tsx` | ui.md §2 |
| SESSION_COOKIE_NAME / SESSION_COOKIE_MAX_AGE_SECONDS | constant | `shared/constants/auth.ts` | domain.md §8 |
| serverLogger | util | `shared/utils/server-logger.ts` | infra.md §5 |
| createRequestLogger | util | `shared/utils/server-logger.ts` | infra.md §5 |
| generateRequestId | util | `shared/utils/server-logger.ts` | infra.md §5 |
| shouldRetry | util | `shared/providers/QueryProvider.tsx` | ui.md §2c |
| Spacer | ui-component | `shared/components/layout/` | ui.md §2 |
| Stack | ui-component | `shared/components/layout/` | ui.md §2 |
| STORE_KIND / STORE_STATUS | constant | `shared/constants/store.ts` | domain.md §8 |
| STORE_VALIDATION_STATUS / REJECTION_REASON_MIN_LENGTH / REJECTION_REASON_MAX_LENGTH | constant | `features/store-validation/constants.ts` | features.md §13 |
| storeValidationService / MockStoreValidationService | service | `features/store-validation/services/` | features.md §13 |
| StoreDetailPanel / StoreDetailPanelContainer | feature-component | `features/store-validation/components/StoreDetailPanel/` | features.md §13 |
| ClusterFeature / StorePointProperties / ClusterProperties | type | `features/map/hooks/useClusters.ts` | features.md §13 |
| ClusterPin | feature-component | `features/map/components/ClusterPin.tsx` | features.md §13 |
| computeClusters / useClusters | hook | `features/map/hooks/useClusters.ts` | features.md §13 |
| StoreDetailSheet / StoreDetailSheetContainer | feature-component | `features/map/components/StoreDetailSheet/` | features.md §13 |
| StoreAnalyticsDashboard / StoreAnalyticsDashboardContainer | feature-component | `features/store-analytics/components/StoreAnalyticsDashboard/` | features.md §13 |
| StoreDashboard / StoreDashboardContainer | feature-component | `features/store-dashboard/components/StoreDashboard/` | features.md §13 |
| StoreProfilePage / StoreProfileForm | feature-component | `features/store-profile/components/` | features.md §13 |
| StoreShell / StoreShellContainer / StoreNav / AvailabilityToggle | feature-component | `features/store-shell/components/` | features.md §13 |
| StoreValidationQueue / StoreValidationQueueContainer | feature-component | `features/store-validation/components/StoreValidationQueue/` | features.md §13 |
| RejectStoreDialog | feature-component | `features/store-validation/components/RejectStoreDialog/` | features.md §13 |
| rejectStoreSchema / RejectStoreFormValues | schema | `features/store-validation/schemas/store-validation.schemas.ts` | features.md §13 |
| PendingStore / ValidationStatus / RejectStoreInput | type | `features/store-validation/types/store-validation.types.ts` | features.md §13 |
| useApproveStoreMutation | hook | `features/store-validation/hooks/useApproveStoreMutation.ts` | features.md §13 |
| useRejectStoreMutation | hook | `features/store-validation/hooks/useRejectStoreMutation.ts` | features.md §13 |
| useStoreValidationQueueQuery | hook | `features/store-validation/hooks/useStoreValidationQueueQuery.ts` | features.md §13 |
| storeAnalyticsService / StoreAnalyticsService | service | `features/store-analytics/services/store-analytics.service.ts` | features.md §13 |
| StoreKpiSummary / AnalyticsPeriod / StoreAnalyticsFilter | type | `features/store-analytics/types/store-analytics.types.ts` | features.md §13 |
| storeRepository | repository | `shared/repositories/store.ts` | data.md §11 |
| Store / StoreKind / StoreStatus | type | `shared/types/store.ts` | domain.md §7 |
| storeSchema | schema | `shared/schemas/store.ts` | domain.md §7b |
| storesService | service | `shared/services/stores.ts` | data.md §4 |
| SYNC_TAG (y otras bg-sync) | constant | `shared/constants/background-sync.ts` | domain.md §8 |
| Text | ui-component | `shared/components/typography/Text.tsx` | ui.md §2 |
| ThemeProvider | ui-component | `shared/components/theme/ThemeProvider.tsx` | ui.md §2 |
| ThemeToggle | ui-component | `shared/components/theme/ThemeToggle.tsx` | ui.md §2 |
| Toaster | ui-component | `shared/components/ui/toaster.tsx` | ui.md §1 |
| transition / ORDER_EVENT / ORDER_ACTOR | domain | `shared/domain/order-state-machine.ts` | domain.md §12 |
| transitionWithAudit / TransitionWithAuditInput | domain | `shared/domain/order-state-machine.ts` | domain.md §12 |
| KpiDashboard / KpiDashboardContainer | feature-component | `features/admin-kpi-dashboard/components/KpiDashboard/` | features.md §13 |
| KpiCard | feature-component | `features/admin-kpi-dashboard/components/KpiCard/` | features.md §13 |
| KpiSnapshot / KpiDashboardService / KpiPeriod | type | `features/admin-kpi-dashboard/types/kpi-dashboard.types.ts` | features.md §13 |
| kpiDashboardService | service | `features/admin-kpi-dashboard/services/kpi-dashboard.mock.ts` | features.md §13 |
| useKpiDashboardQuery | hook | `features/admin-kpi-dashboard/hooks/useKpiDashboardQuery.ts` | features.md §13 |
| KPI_TARGETS / KPI_QUERY_STALE_TIME_MS / KPI_MOCK_DELAY_MS | constant | `features/admin-kpi-dashboard/constants/kpi-dashboard.constants.ts` | features.md §13 |
| OrderAuditLogContainer | feature-component | `features/admin-audit-log/components/OrderAuditLog/` | features.md §13 |
| useAuditLogQuery | hook | `features/admin-audit-log/hooks/useAuditLogQuery.ts` | features.md §13 |
| useAcceptOrderMutation | hook | `features/orders/hooks/useAcceptOrderMutation.ts` | data.md §3 |
| IncomingOrdersInbox / IncomingOrdersInboxContainer | feature-component | `features/orders/components/IncomingOrdersInbox/` | features.md §13 |
| useNewOrderAlert | hook | `features/orders/hooks/useNewOrderAlert.ts` | features.md §13 |
| useStoreOrdersQuery | hook | `features/orders/hooks/useStoreOrdersQuery.ts` | features.md §13 |
| useAvailability | hook | `features/store-shell/hooks/useAvailability.ts` | features.md §13 |
| useCartStore | store | `shared/stores/cart.ts` | infra.md §10 |
| useCatalogQuery | hook | `features/catalog/hooks/useCatalogQuery.ts` | features.md §13 |
| useFocusTrap / UseFocusTrapOptions | hook | `shared/hooks/useFocusTrap.ts` | infra.md §11 |
| useServiceWorkerUpdate / UseServiceWorkerUpdateResult | hook | `shared/hooks/useServiceWorkerUpdate.ts` | infra.md §11 |
| useServiceWorkerControllerReload | hook | `shared/hooks/useServiceWorkerControllerReload.ts` | infra.md §11 |
| SW_MESSAGE_TYPE / SW_UPDATE_STATUS / SW_UPDATE_CHECK_INTERVAL_MS / SwUpdateStatus / SwMessageType | constant | `shared/constants/service-worker.ts` | domain.md §8 |
| useCreateProductMutation | hook | `features/catalog/hooks/useCreateProductMutation.ts` | features.md §13 |
| useDeleteProductMutation | hook | `features/catalog/hooks/useDeleteProductMutation.ts` | features.md §13 |
| useGeolocation | hook | `shared/hooks/useGeolocation.ts` | data.md §3 |
| useLocationPublishing | hook | `features/store-shell/hooks/useLocationPublishing.ts` | features.md §13 |
| useCurrentStoreQuery | hook | `shared/hooks/useCurrentStoreQuery.ts` | data.md §3 |
| useOrderQuery | hook | `features/orders/hooks/useOrderQuery.ts` | data.md §3 |
| useStoreOrdersQuery | hook | `features/orders/hooks/useStoreOrdersQuery.ts` | data.md §3 |
| useOrdersQuery | hook | `features/orders/hooks/useOrdersQuery.ts` | features.md §13 |
| useRealtimeInvalidation | hook | `shared/query/useRealtimeInvalidation.ts` | data.md §2b |
| useRealtimeStatus | hook | `shared/hooks/useRealtimeStatus.ts` | data.md §3 |
| useSendOrderMutation | hook | `features/orders/hooks/useSendOrderMutation.ts` | data.md §3 |
| useSession | hook | `shared/hooks/useSession.ts` | data.md §3 |
| useStoreByIdQuery | hook | `features/map/hooks/useStoreByIdQuery.ts` | data.md §3 |
| useStoreKpiQuery | hook | `features/store-analytics/hooks/useStoreKpiQuery.ts` | features.md §13 |
| useStoreProductsQuery | hook | `features/map/hooks/useStoreProductsQuery.ts` | data.md §3 |
| useStoreProfileQuery | hook | `features/store-profile/hooks/useStoreProfileQuery.ts` | data.md §3 |
| useStoresNearbyQuery | hook | `features/map/hooks/useStoresNearbyQuery.ts` | data.md §3 |
| useUIStore | store | `shared/stores/ui.ts` | infra.md §10 |
| useUpdateProductMutation | hook | `features/catalog/hooks/useUpdateProductMutation.ts` | features.md §13 |
| useUpdateStoreProfileMutation | hook | `features/store-profile/hooks/useUpdateStoreProfileMutation.ts` | data.md §3 |
| USER_ROLES | constant | `shared/constants/user.ts` | domain.md §8 |
| USER_SUSPENSION_STATUS / UserSuspensionStatus | constant | `shared/constants/user-management.ts` | domain.md §8 |
| User / UserRole / Session | type | `shared/types/user.ts` | domain.md §7 |
| userRepository | repository | `shared/repositories/user.ts` | data.md §11 |
| SupabaseUserRepository | repository-impl | `shared/repositories/supabase/users.supabase.ts` | data.md §11b |
| SupabaseStoreRepository | repository-impl | `shared/repositories/supabase/stores.supabase.ts` | data.md §11b |
| SupabaseProductRepository | repository-impl | `shared/repositories/supabase/products.supabase.ts` | data.md §11b |
| SupabaseOrderRepository | repository-impl | `shared/repositories/supabase/orders.supabase.ts` | data.md §11b |
| SupabaseAuditLogService | service-impl | `shared/repositories/supabase/audit-log.supabase.ts` | data.md §11b |
| SupabasePushSubscriptionRepository | repository-impl | `shared/repositories/supabase/push-subscriptions.supabase.ts` | data.md §11b |
| PushSubscriptionRepository / PushSubscription / CreatePushSubscriptionInput | repository + type | `shared/repositories/push-subscriptions.ts` | data.md §11 |
| createSupabaseBrowserClient / SupabaseClient | factory + type | `shared/repositories/supabase/client.ts` | data.md §11b |
| mapUserRow / mapStoreRow / mapProductRow / mapOrderRow / mapPushSubscriptionRow | mapper | `shared/repositories/supabase/mappers.ts` | data.md §11b |
| userSchema / sessionSchema | schema | `shared/schemas/user.ts` | domain.md §7b |
| suspendUserSchema / reinstateUserSchema / SuspendUserInput / ReinstateUserInput | schema | `shared/schemas/user-management.ts` | domain.md §7b |
| createUserManagementService / UserManagementService | service | `features/user-management/services/userManagement.service.ts` | data.md §4 |
| useUsersQuery | hook | `features/user-management/hooks/useUsersQuery.ts` | data.md §3 |
| useSuspendUserMutation | hook | `features/user-management/hooks/useSuspendUserMutation.ts` | data.md §3 |
| useReinstateUserMutation | hook | `features/user-management/hooks/useReinstateUserMutation.ts` | data.md §3 |
| UserManagementPage / UserManagementPageContainer | feature-component | `features/user-management/components/UserManagementPage/` | features.md §13 |
| UserTable | feature-component | `features/user-management/components/UserTable/` | features.md §13 |
| SuspendConfirmDialog | feature-component | `features/user-management/components/SuspendConfirmDialog/` | features.md §13 |
| SlowQueriesPanel / SlowQueriesPanelContainer | feature-component | `features/admin-observability/components/SlowQueriesPanel/` | features.md §13 |
| useSlowQueriesQuery | hook | `features/admin-observability/hooks/useSlowQueriesQuery.ts` | features.md §13 |
| SLOW_QUERIES_LIMIT / SLOW_QUERIES_STALE_TIME_MS / QUERY_TRUNCATE_LENGTH | constant | `features/admin-observability/constants/admin-observability.constants.ts` | features.md §13 |
| GET /api/admin/slow-queries | route-handler | `app/api/admin/slow-queries/route.ts` | infra.md §14 |
| SlowQuery / slowQuerySchema / slowQueryArraySchema | type + schema | `shared/types/observability.ts` | domain.md §7 |

---

## Cómo actualizar este registro

1. Identificá la categoría del nuevo elemento → editá el detail file correspondiente en `shared/REGISTRY-detail/`.
2. Agregá **una línea** en la tabla de índice rápido de arriba (nombre, tipo, ruta, detail).
3. Actualizá en el **mismo commit** que el código.
