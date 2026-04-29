import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { eventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT, type OrderDomainEvent } from "@/shared/domain/events";
import {
  clearCaptureStore,
  listCapturedPushes,
  subscribeUser,
} from "@/shared/services/push.test-capture";

import { registerE2EPushListener, resetE2EWiring } from "./wiring.e2e";

const CLIENT_ID = "demo-client-1";
const STORE_ID = "store-demo-1";
const ORDER_ID = "order-1";

function makeOrderAcceptedEvent(): OrderDomainEvent {
  const now = new Date();
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: now,
    sentAt: now,
    receivedAt: now,
    acceptedAt: now,
  };
}

let unregister: () => void;

beforeEach(() => {
  clearCaptureStore();
  unregister = registerE2EPushListener();
});

afterEach(() => {
  unregister();
  resetE2EWiring();
  clearCaptureStore();
});

describe("registerE2EPushListener", () => {
  it("captures a push for the order's client when ORDER_ACCEPTED is published", async () => {
    subscribeUser(CLIENT_ID);

    eventBus.publish(makeOrderAcceptedEvent());

    // Listener handler is async; allow microtasks to flush.
    await Promise.resolve();
    await Promise.resolve();

    const captures = listCapturedPushes(CLIENT_ID);
    expect(captures).toHaveLength(1);
    expect(captures[0]?.payload.title).toMatch(/aceptado/i);
  });

  it("does not capture a push when the client is not subscribed", async () => {
    // Sentinel subscriber proves the listener is alive — without it, this test would
    // pass even if registerE2EPushListener silently no-op'd (regression of MEDIUM-2).
    const sentinelClientId = `${CLIENT_ID}-other`;
    subscribeUser(sentinelClientId);

    eventBus.publish({ ...makeOrderAcceptedEvent(), clientId: sentinelClientId });
    await Promise.resolve();
    await Promise.resolve();
    expect(listCapturedPushes(sentinelClientId)).toHaveLength(1);

    eventBus.publish(makeOrderAcceptedEvent());
    await Promise.resolve();
    await Promise.resolve();
    expect(listCapturedPushes(CLIENT_ID)).toHaveLength(0);
  });

  it("returns the same unregister function on repeated registration (idempotent)", () => {
    const second = registerE2EPushListener();
    expect(second).toBe(unregister);
  });
});
