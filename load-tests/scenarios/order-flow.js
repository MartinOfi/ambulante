/**
 * Order flow scenario.
 * Simulates the full order lifecycle: client sends → system receives →
 * store accepts → store finalizes.
 *
 * PRD §8 KPIs targeted:
 *   - Pedidos enviados / día → throughput metric
 *   - Tiempo promedio de respuesta < 3 min (RECIBIDO → ACEPTADO)
 *   - Tasa de expiración < 15%
 *
 * State machine (§7.1): ENVIADO → RECIBIDO → ACEPTADO → FINALIZADO
 * Only valid transitions are simulated. Actor rules are respected.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import {
  BASE_URL,
  HTTP_TIMEOUT_MS,
  LOAD_STAGES,
  ORDER_FLOW_THRESHOLDS,
  randomBetween,
} from "../k6.config.js";

export const options = {
  stages: LOAD_STAGES,
  thresholds: {
    ...ORDER_FLOW_THRESHOLDS,
    // PRD §8: RECIBIDO→ACEPTADO < 3min
    order_acceptance_ms: ["p(95)<180000"],
    // PRD §8: finalización ≥70%
    order_finalization_rate: ["rate>0.70"],
  },
};

// ─── Custom metrics ───────────────────────────────────────────────────────────

/** Time from RECIBIDO to ACEPTADO — PRD §8 target < 3 min */
const orderAcceptanceMs = new Trend("order_acceptance_ms");
/** Total orders submitted */
const ordersSubmitted = new Counter("orders_submitted");
/** Orders that were accepted (vs rejected/expired) */
const ordersAccepted = new Counter("orders_accepted");
/** Orders that expired without response (tasa de expiración) */
const ordersExpired = new Counter("orders_expired");
/** Rate of successful end-to-end flows */
const flowSuccessRate = new Rate("order_flow_success");
/** Rate of orders that reached FINALIZADO — PRD §8 target ≥70% */
const orderFinalizationRate = new Rate("order_finalization_rate");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOrderPayload(storeId) {
  return JSON.stringify({
    storeId,
    items: [
      {
        productId: `product-${Math.floor(Math.random() * 10) + 1}`,
        quantity: Math.floor(randomBetween(1, 3)),
        // Snapshot: price included at order time (§7.4)
        priceAtOrder: parseFloat(randomBetween(200, 1500).toFixed(2)),
        nameAtOrder: "Empanada de carne",
      },
    ],
    notes: "",
  });
}

function buildStatusPayload(newStatus, actor) {
  return JSON.stringify({ status: newStatus, actor });
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

export default function orderFlow() {
  const storeId = `store-${Math.floor(Math.random() * 20) + 1}`;

  // Step 1: CLIENT sends order → POST /api/orders
  const sendResponse = http.post(`${BASE_URL}/api/orders`, buildOrderPayload(storeId), {
    headers: { "Content-Type": "application/json" },
    timeout: HTTP_TIMEOUT_MS,
  });

  const orderCreated = check(sendResponse, {
    "order created (201)": (res) => res.status === 201,
  });

  if (!orderCreated) {
    flowSuccessRate.add(false);
    return;
  }

  ordersSubmitted.add(1);

  let orderId;
  try {
    const body = JSON.parse(sendResponse.body);
    orderId = body.data?.id ?? body.id;
  } catch {
    flowSuccessRate.add(false);
    return;
  }

  if (!orderId) {
    flowSuccessRate.add(false);
    return;
  }

  // Step 2: SYSTEM transitions to RECIBIDO → PATCH /api/orders/:id/status
  // (In real flow this is immediate server-side — simulated with minimal delay)
  sleep(0.1);

  const receivedResponse = http.patch(
    `${BASE_URL}/api/orders/${orderId}/status`,
    buildStatusPayload("RECIBIDO", "system"),
    { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
  );

  const receivedOk = check(receivedResponse, {
    "order marked RECIBIDO (200)": (res) => res.status === 200 || res.status === 204,
  });

  if (!receivedOk) {
    flowSuccessRate.add(false);
    return;
  }

  // Capture after check passes so elapsed time measures the business window only
  const receivedAt = Date.now();

  // Step 3: STORE accepts → PATCH /api/orders/:id/status (actor: store)
  // Think time: store responds in 5-30s in this load scenario
  sleep(randomBetween(5, 30));

  const acceptedResponse = http.patch(
    `${BASE_URL}/api/orders/${orderId}/status`,
    buildStatusPayload("ACEPTADO", "store"),
    { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
  );

  const isAccepted = check(acceptedResponse, {
    "order ACEPTADO (200)": (res) => res.status === 200 || res.status === 204,
  });

  if (isAccepted) {
    ordersAccepted.add(1);
    orderAcceptanceMs.add(Date.now() - receivedAt);
  } else {
    // Simulate expired path (store didn't respond within window)
    ordersExpired.add(1);
    flowSuccessRate.add(false);
    return;
  }

  // Step 4: CLIENT moves to EN_CAMINO → PATCH /api/orders/:id/status
  sleep(randomBetween(30, 120));

  http.patch(
    `${BASE_URL}/api/orders/${orderId}/status`,
    buildStatusPayload("EN_CAMINO", "client"),
    { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
  );

  // Step 5: STORE finalizes → PATCH /api/orders/:id/status
  sleep(randomBetween(5, 30));

  const finalizedResponse = http.patch(
    `${BASE_URL}/api/orders/${orderId}/status`,
    buildStatusPayload("FINALIZADO", "store"),
    { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
  );

  const isFinalized = check(finalizedResponse, {
    "order FINALIZADO (200)": (res) => res.status === 200 || res.status === 204,
  });

  orderFinalizationRate.add(isFinalized);
  flowSuccessRate.add(isFinalized);

  sleep(randomBetween(1, 3));
}
