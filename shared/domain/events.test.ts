import { describe, it, expect } from "vitest";
import {
  ORDER_DOMAIN_EVENT,
  serializeEvent,
  type OrderAcceptedDomainEvent,
  type OrderExpiredDomainEvent,
  type OrderDomainEvent,
} from "./events";

describe("ORDER_DOMAIN_EVENT", () => {
  it("defines all 8 event types as string constants", () => {
    const keys = Object.keys(ORDER_DOMAIN_EVENT);
    expect(keys).toHaveLength(8);
    expect(ORDER_DOMAIN_EVENT.ORDER_SENT).toBe("ORDER_SENT");
    expect(ORDER_DOMAIN_EVENT.ORDER_RECEIVED).toBe("ORDER_RECEIVED");
    expect(ORDER_DOMAIN_EVENT.ORDER_ACCEPTED).toBe("ORDER_ACCEPTED");
    expect(ORDER_DOMAIN_EVENT.ORDER_REJECTED).toBe("ORDER_REJECTED");
    expect(ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY).toBe("ORDER_ON_THE_WAY");
    expect(ORDER_DOMAIN_EVENT.ORDER_FINISHED).toBe("ORDER_FINISHED");
    expect(ORDER_DOMAIN_EVENT.ORDER_CANCELLED).toBe("ORDER_CANCELLED");
    expect(ORDER_DOMAIN_EVENT.ORDER_EXPIRED).toBe("ORDER_EXPIRED");
  });

  it("is frozen (immutable at runtime)", () => {
    expect(Object.isFrozen(ORDER_DOMAIN_EVENT)).toBe(true);
  });
});

describe("serializeEvent", () => {
  it("converts Date fields to ISO strings in OrderAcceptedDomainEvent", () => {
    const acceptedAt = new Date("2026-04-16T10:00:00.000Z");
    const receivedAt = new Date("2026-04-16T09:00:00.000Z");
    const sentAt = new Date("2026-04-16T08:00:00.000Z");

    const event: OrderAcceptedDomainEvent = {
      type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
      orderId: "order-1",
      clientId: "client-1",
      storeId: "store-1",
      occurredAt: acceptedAt,
      sentAt,
      receivedAt,
      acceptedAt,
    };

    const serialized = serializeEvent(event);

    expect(serialized.type).toBe("ORDER_ACCEPTED");
    expect(serialized.orderId).toBe("order-1");
    expect(serialized.occurredAt).toBe("2026-04-16T10:00:00.000Z");
    expect(serialized.payload.acceptedAt).toBe("2026-04-16T10:00:00.000Z");
    expect(serialized.payload.receivedAt).toBe("2026-04-16T09:00:00.000Z");
    expect(serialized.payload.sentAt).toBe("2026-04-16T08:00:00.000Z");
  });

  it("serializes OrderExpiredDomainEvent correctly", () => {
    const expiredAt = new Date("2026-04-16T10:10:00.000Z");

    const event: OrderExpiredDomainEvent = {
      type: ORDER_DOMAIN_EVENT.ORDER_EXPIRED,
      orderId: "order-2",
      clientId: "client-2",
      storeId: "store-2",
      occurredAt: expiredAt,
      sentAt: new Date("2026-04-16T10:00:00.000Z"),
      expiredAt,
    };

    const serialized = serializeEvent(event);

    expect(serialized.type).toBe("ORDER_EXPIRED");
    expect(serialized.payload.expiredAt).toBe("2026-04-16T10:10:00.000Z");
  });

  it("produces a JSON-safe object (no Date instances)", () => {
    const sentAt = new Date();

    const event: OrderDomainEvent = {
      type: ORDER_DOMAIN_EVENT.ORDER_SENT,
      orderId: "order-3",
      clientId: "client-3",
      storeId: "store-3",
      occurredAt: sentAt,
      sentAt,
    };

    const serialized = serializeEvent(event);
    const roundTripped = JSON.parse(JSON.stringify(serialized));

    expect(roundTripped).toEqual(serialized);
  });
});
