import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import type { OrderSentDomainEvent } from "@/shared/domain/events";
import { createMockRealtimeService, REALTIME_CHANNELS } from "./realtime";
import type { RealtimeMessage, TestableRealtimeService } from "./realtime.types";

// Each test gets a fresh event bus and realtime service to avoid cross-test pollution.
function makeTestBus() {
  return createEventBus();
}

describe("createMockRealtimeService", () => {
  let service: TestableRealtimeService;

  beforeEach(() => {
    service = createMockRealtimeService({ eventBus: makeTestBus() });
  });

  afterEach(() => {
    service.destroy();
  });

  describe("status", () => {
    it("returns 'online' immediately after creation", () => {
      expect(service.status()).toBe("online");
    });
  });

  describe("subscribe / deliver", () => {
    it("delivers a message to a subscriber on the matching channel", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_ACCEPTED", { orderId: "1" });

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        channel: REALTIME_CHANNELS.orders,
        event: "ORDER_ACCEPTED",
        payload: { orderId: "1" },
      });
    });

    it("does not deliver to subscribers of other channels", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.stores, (msg) => received.push(msg));

      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_ACCEPTED", {});

      expect(received).toHaveLength(0);
    });

    it("delivers to multiple subscribers on the same channel", () => {
      const first: RealtimeMessage<unknown>[] = [];
      const second: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => first.push(msg));
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => second.push(msg));

      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {});

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
    });

    it("isolates a failing handler so others still receive the message", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.orders, () => {
        throw new Error("handler crash");
      });
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      expect(() => service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {})).not.toThrow();
      expect(received).toHaveLength(1);
    });
  });

  describe("subscribe cleanup", () => {
    it("unsubscribes the specific handler returned by subscribe()", () => {
      const received: RealtimeMessage<unknown>[] = [];
      const unsubscribe = service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      unsubscribe();
      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {});

      expect(received).toHaveLength(0);
    });

    it("only removes the specific handler, not others on the same channel", () => {
      const first: RealtimeMessage<unknown>[] = [];
      const second: RealtimeMessage<unknown>[] = [];
      const unsubscribeFirst = service.subscribe(REALTIME_CHANNELS.orders, (msg) =>
        first.push(msg),
      );
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => second.push(msg));

      unsubscribeFirst();
      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {});

      expect(first).toHaveLength(0);
      expect(second).toHaveLength(1);
    });
  });

  describe("unsubscribe(channel)", () => {
    it("removes all handlers for the given channel", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      service.unsubscribe(REALTIME_CHANNELS.orders);
      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {});

      expect(received).toHaveLength(0);
    });

    it("does not affect other channels", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.stores, (msg) => received.push(msg));

      service.unsubscribe(REALTIME_CHANNELS.orders);
      service._testDeliver(REALTIME_CHANNELS.stores, "STORE_UPDATED", {});

      expect(received).toHaveLength(1);
    });
  });

  describe("onStatusChange", () => {
    it("notifies status change handlers when status changes", () => {
      const statuses: string[] = [];
      service.onStatusChange((status) => statuses.push(status));

      service._testSetStatus("offline");
      service._testSetStatus("connecting");
      service._testSetStatus("online");

      expect(statuses).toEqual(["offline", "connecting", "online"]);
    });

    it("returns cleanup to unregister the status handler", () => {
      const statuses: string[] = [];
      const cleanup = service.onStatusChange((status) => statuses.push(status));

      cleanup();
      service._testSetStatus("offline");

      expect(statuses).toHaveLength(0);
    });
  });

  describe("event bus integration", () => {
    it("delivers a serialized domain event to the 'orders' channel", () => {
      const testBus = makeTestBus();
      const svc = createMockRealtimeService({ eventBus: testBus });

      const received: RealtimeMessage<unknown>[] = [];
      svc.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      const event: OrderSentDomainEvent = {
        type: ORDER_DOMAIN_EVENT.ORDER_SENT,
        orderId: "ord-1",
        clientId: "cli-1",
        storeId: "sto-1",
        occurredAt: new Date("2026-01-01T00:00:00Z"),
        sentAt: new Date("2026-01-01T00:00:00Z"),
      };
      testBus.publish(event);

      expect(received).toHaveLength(1);
      expect(received[0].channel).toBe(REALTIME_CHANNELS.orders);
      expect(received[0].event).toBe(ORDER_DOMAIN_EVENT.ORDER_SENT);

      svc.destroy();
    });

    it("does not receive events after destroy()", () => {
      const testBus = makeTestBus();
      const svc = createMockRealtimeService({ eventBus: testBus });

      const received: RealtimeMessage<unknown>[] = [];
      svc.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      svc.destroy();

      const event: OrderSentDomainEvent = {
        type: ORDER_DOMAIN_EVENT.ORDER_SENT,
        orderId: "ord-2",
        clientId: "cli-2",
        storeId: "sto-2",
        occurredAt: new Date(),
        sentAt: new Date(),
      };
      testBus.publish(event);

      expect(received).toHaveLength(0);
    });
  });

  describe("destroy", () => {
    it("clears all channel handlers", () => {
      const received: RealtimeMessage<unknown>[] = [];
      service.subscribe(REALTIME_CHANNELS.orders, (msg) => received.push(msg));

      service.destroy();
      service._testDeliver(REALTIME_CHANNELS.orders, "ORDER_SENT", {});

      expect(received).toHaveLength(0);
    });
  });
});

describe("REALTIME_CHANNELS", () => {
  it("exports expected channel names", () => {
    expect(REALTIME_CHANNELS.orders).toBe("orders");
    expect(REALTIME_CHANNELS.stores).toBe("stores");
  });
});
