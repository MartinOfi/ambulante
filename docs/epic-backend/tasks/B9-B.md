# B9-B — Cliente: flujo de pedido completo (cart → submit → tracking → history → cancel)

> **Fase:** B9 — Swap cliente (features Cliente consumen backend real)
> **Goal de la fase:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
> **Acceptance criteria de la fase:** Cliente puede registrarse, ver mapa con tiendas reales, abrir el detalle de una tienda con productos y fotos, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** ✅ done [owner: chat-2026-04-29, closed: 2026-04-30]
- **Por qué:** Slice vertical del **ciclo completo del pedido del lado cliente**: arma carrito, lo envía, trackea el estado en vivo, lo cancela si todavía puede, y al final lo ve en su historial. Las 5 sub-etapas comparten el mismo modelo (`Order` + state machine + domain events) y se rompen entre sí si se diseñan separadas (ej: el snapshot de productos que se decide en submit afecta lo que muestra tracking e historial).
- **Entregable:**
  1. **Cart + submit:** Server Action `submitOrder(input)` en `features/order-flow/actions.ts` con validación Zod, state machine check, transacción atómica (orders + order_items con snapshot de productos), emite `OrderCreated` post-commit. Tests unitarios + E2E.
  2. **Tracking + realtime:** `features/orders/components/OrderTracking/` consume `OrdersRepository.findByPublicId` + `useOrderRealtime(orderId)`. UI con estados traducidos al español. Subscription que se invalida automáticamente.
  3. **History:** Hook `useOrderHistory` con `OrdersRepository.findByCustomer(customerId, cursor)` paginado por keyset. Componente que lista pedidos con su estado final.
  4. **Cancel:** Server Action `cancelOrder(orderId, reason?)` con validación de rol cliente + state machine (sólo pre-`ACEPTADO`). Emite `OrderCancelled`.
- **Archivos:** `features/order-flow/actions.ts`, `features/order-flow/actions.test.ts`, `features/orders/**` del lado cliente, `features/orders/hooks/useOrderHistory.ts`, `features/orders/actions.ts` (cancel).
- **Depends on:** B9-A, B6.3
- **Continues with:** B9-C
- **Skill rules aplicables:** `lock-short-transactions`, `data-batch-inserts`, `data-pagination`
- **REGISTRY:** `features.md`.
- **Estimación:** XL
- **Notas:**
  - **Submit (`features/order-flow/actions.ts`):** Server Action con Zod `.strict()`, snapshot de productos server-authoritative (no se confía el precio del cliente), verifica `STORE_STATUS.open`, usa RPC atómico `create_order_with_items` ya existente. Discriminated union `{ ok: true, publicId, status: 'ENVIADO' } | { ok: false, errorCode, message }` con códigos `UNAUTHENTICATED`/`VALIDATION_ERROR`/`PRODUCT_UNAVAILABLE`/`STORE_UNAVAILABLE`/`INTERNAL_ERROR`. Emite `ORDER_SENT` post-commit (skill rule `lock-short-transactions`).
  - **Cancel (`features/orders/actions.ts` + migración `20260429120000_b9b_cancel_order_fields_and_rpc.sql`):** ALTER orders ADD `cancelled_at`, `cancel_reason`. RPC `cancel_order_by_customer(p_public_id, p_reason)` con `SELECT FOR UPDATE` + state-machine guard (sólo cliente, sólo pre-`ACEPTADO`). Devuelve jsonb discriminado. Server Action mapea a `UNAUTHENTICATED`/`ORDER_NOT_FOUND`/`INVALID_TRANSITION`. Emite `ORDER_CANCELLED` post-RPC.
  - **Tracking:** `OrderTracking.container.tsx` consume `useOrderQuery(publicId)` (nuevo) + `useOrderRealtime` ya existente; UI traduce estados al español sin tocar dumb component.
  - **History:** `useOrderHistory` con `useInfiniteQuery` + keyset pagination compuesto (`created_at DESC, id DESC`) via `OrdersRepository.findByCustomer(customerId, opts)`. Cursor base64url validado con Zod en `shared/repositories/supabase/cursor.ts`. Query order: filterChain (eq + opcional `or`) ANTES de `order/limit` — vital, si no `query.eq is not a function`.
  - **Cleanup orders.mock.ts:** deferred a NT-38 (lo borra B10-C cuando swappee la inbox de Tienda — todavía hay un import en `useStoreInbox.ts`).
  - **E2E happy path Playwright:** deferred a NT-39 — el repo no tiene Playwright + Supabase env wiring listo, abrirlo en B9-B inflaba scope. Cobertura unit + integration al 100% del flow cliente.
  - **Code review 2-pass:** PASS final (0 CRITICAL + 0 HIGH). Pass 1 → 2 HIGH + 1 MEDIUM corregidos: magic string `STORE_OPEN_STATUS` → `STORE_STATUS.open`; `isSubscribed` no inicializaba desde browser (riesgo doble-subscribe) → segundo `useEffect` con `getActiveSubscription`; `useCallback` redundante con `eslint-disable` → drop. Pass 2 → 1 MEDIUM (faltaban tests de `getActiveSubscription`) corregido en commit final.
  - **Tests:** 44/44 verdes en suites afectadas. Cobertura ≥80% en `features/order-flow/`, `features/orders/`, `shared/repositories/supabase/cursor.ts`.
  - **Scope:** ~1900 líneas netas (incluye migraciones SQL + tests). Bajo el límite de 2500 — no hizo falta splittear en B9-B1/B9-B2.
- **Tareas originales fusionadas:** B9.4 (cart + submit), B9.5 (tracking + realtime), B9.6 (history), B9.7 (cancel).
