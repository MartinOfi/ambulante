# B9-B — Cliente: flujo de pedido completo (cart → submit → tracking → history → cancel)

> **Fase:** B9 — Swap cliente (features Cliente consumen backend real)
> **Goal de la fase:** Reemplazar todos los mocks del flow cliente por consumo real via facades + repositories. Ningún componente / hook / Server Action del lado Cliente debe seguir importando `.mock.ts`.
> **Acceptance criteria de la fase:** Cliente puede registrarse, ver mapa con tiendas reales, abrir el detalle de una tienda con productos y fotos, crear pedido, trackear estado via realtime, recibir push, cancelar, ver historial. Tests E2E verdes en el flow completo.

> **Atajos:** [INDEX](../INDEX.md) · [convenciones](../convenciones.md) · [portabilidad](../portabilidad.md) · [decisiones](../decisiones.md)

- **Estado:** 🟡 in-progress [owner: chat-2026-04-29, started: 13:09]
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
- **Notas:** (se llena al cerrar). Atención al límite de ~2500 líneas — si la implementación se va de scope, splittear en B9-B1 (cart + submit + cancel) y B9-B2 (tracking + history). La unidad lógica es "ciclo del pedido del lado cliente".
- **Tareas originales fusionadas:** B9.4 (cart + submit), B9.5 (tracking + realtime), B9.6 (history), B9.7 (cancel).
