/**
 * Spike test.
 * Instantly ramps to 500 VUs to validate system resilience under sudden load.
 *
 * PRD §9.3: "Dos acciones simultáneas sobre el mismo pedido → resolver por
 * timestamp del servidor; la primera transición gana."
 *
 * This scenario deliberately creates concurrent transitions on the same orders
 * to surface race conditions. The server must return 409 (conflict) on the
 * losing transition, not 500 or silent data corruption.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";
import { BASE_URL, HTTP_TIMEOUT_MS, SPIKE_STAGES, randomBetween } from "../k6.config.js";

export const options = {
  stages: SPIKE_STAGES,
  thresholds: {
    // During a spike, allow slightly higher error rate — but not catastrophic failure
    http_req_failed: ["rate<0.05"],
    // p95 can degrade under spike — but must recover
    http_req_duration: ["p(95)<2000"],
    // Race conditions must resolve correctly (no 5xx on concurrent transitions)
    race_condition_5xx: ["rate<0.01"],
  },
};

const raceCondition5xx = new Rate("race_condition_5xx");
const conflictsResolved = new Counter("conflicts_resolved_correctly");

const HOT_ORDER_COUNT = 20;

/**
 * Pre-seed HOT_ORDER_COUNT orders in RECIBIDO state before VUs start.
 * PRD §9.3 race: CLIENT→CANCELADO vs STORE→ACEPTADO — both valid from RECIBIDO.
 * Without known state the server returns 422 (invalid transition), not 409 (race),
 * so the spike never actually exercises the concurrent-transition conflict path.
 */
export function setup() {
  const hotOrderIds = [];

  for (let i = 0; i < HOT_ORDER_COUNT; i++) {
    const createResponse = http.post(
      `${BASE_URL}/api/orders`,
      JSON.stringify({
        storeId: `store-${(i % 20) + 1}`,
        items: [
          { productId: "product-1", quantity: 1, priceAtOrder: 500, nameAtOrder: "Spike item" },
        ],
        notes: "spike-test-seed",
      }),
      { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
    );

    if (createResponse.status !== 201) continue;

    let orderId;
    try {
      const body = JSON.parse(createResponse.body);
      orderId = body.data?.id ?? body.id;
    } catch {
      continue;
    }

    if (!orderId) continue;

    http.patch(
      `${BASE_URL}/api/orders/${orderId}/status`,
      JSON.stringify({ status: "RECIBIDO", actor: "system" }),
      { headers: { "Content-Type": "application/json" }, timeout: HTTP_TIMEOUT_MS },
    );

    hotOrderIds.push(orderId);
  }

  return { hotOrderIds };
}

export default function spikeTest(data) {
  const { hotOrderIds = [] } = data ?? {};

  // If setup produced real order IDs use them; otherwise fall back to synthetic IDs
  // so the script stays runnable against a stub that ignores state (e.g. CI mock).
  const hotOrderId =
    hotOrderIds.length > 0
      ? hotOrderIds[Math.floor(Math.random() * hotOrderIds.length)]
      : `order-${Math.floor(Math.random() * HOT_ORDER_COUNT) + 1}`;

  // Two competing actors try to transition the same order simultaneously
  // Client tries to CANCEL, Store tries to ACCEPT — only one should win
  const actorIsClient = Math.random() < 0.5;
  const targetStatus = actorIsClient ? "CANCELADO" : "ACEPTADO";
  const actor = actorIsClient ? "client" : "store";

  const payload = JSON.stringify({ status: targetStatus, actor });

  const response = http.patch(`${BASE_URL}/api/orders/${hotOrderId}/status`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: HTTP_TIMEOUT_MS,
  });

  // Server must respond with: 200 (won), 409 (conflict/lost), or 422 (invalid transition)
  // Never 500 — that means unhandled race condition.
  check(response, {
    "no 5xx on concurrent transition": (res) => res.status < 500,
    "race condition resolved correctly (200 or 409)": (res) =>
      res.status === 200 || res.status === 204 || res.status === 409 || res.status === 422,
  });

  if (response.status >= 500) {
    raceCondition5xx.add(1);
  } else {
    raceCondition5xx.add(0);
    if (response.status === 409 || response.status === 200) {
      conflictsResolved.add(1);
    }
  }

  // Minimal think time — spike means sustained high concurrency
  sleep(randomBetween(0.1, 0.5));
}
