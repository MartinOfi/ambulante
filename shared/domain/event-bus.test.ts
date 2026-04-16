import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./event-bus";
import {
  ORDER_DOMAIN_EVENT,
  type OrderSentDomainEvent,
  type OrderAcceptedDomainEvent,
} from "./events";

function makeSentEvent(orderId = "order-1"): OrderSentDomainEvent {
  const sentAt = new Date("2026-04-16T10:00:00.000Z");
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_SENT,
    orderId,
    clientId: "client-1",
    storeId: "store-1",
    occurredAt: sentAt,
    sentAt,
  };
}

function makeAcceptedEvent(orderId = "order-1"): OrderAcceptedDomainEvent {
  const now = new Date("2026-04-16T10:05:00.000Z");
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
    orderId,
    clientId: "client-1",
    storeId: "store-1",
    occurredAt: now,
    sentAt: new Date("2026-04-16T10:00:00.000Z"),
    receivedAt: new Date("2026-04-16T10:01:00.000Z"),
    acceptedAt: now,
  };
}

describe("createEventBus", () => {
  it("delivers published events to matching subscribers", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handler);
    bus.publish(makeSentEvent());

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(makeSentEvent());
  });

  it("does not deliver events to subscribers of other types", () => {
    const bus = createEventBus();
    const sentHandler = vi.fn();
    const acceptedHandler = vi.fn();

    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, sentHandler);
    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_ACCEPTED, acceptedHandler);
    bus.publish(makeSentEvent());

    expect(sentHandler).toHaveBeenCalledTimes(1);
    expect(acceptedHandler).not.toHaveBeenCalled();
  });

  it("delivers to multiple subscribers of the same type", () => {
    const bus = createEventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handlerA);
    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handlerB);
    bus.publish(makeSentEvent());

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops the handler from receiving events", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handler);
    unsubscribe();
    bus.publish(makeSentEvent());

    expect(handler).not.toHaveBeenCalled();
  });

  it("unsubscribing one handler does not affect others", () => {
    const bus = createEventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    const unsubscribeA = bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handlerA);
    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, handlerB);
    unsubscribeA();
    bus.publish(makeSentEvent());

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it("calls serialization hook when an event is published", () => {
    const bus = createEventBus();
    const serializationHook = vi.fn();

    bus.registerSerializationHook(serializationHook);
    bus.publish(makeSentEvent());

    expect(serializationHook).toHaveBeenCalledTimes(1);
    const calledWith = serializationHook.mock.calls[0][0];
    expect(calledWith.type).toBe("ORDER_SENT");
    expect(typeof calledWith.occurredAt).toBe("string");
  });

  it("unregistering serialization hook stops it from being called", () => {
    const bus = createEventBus();
    const hook = vi.fn();

    const unregister = bus.registerSerializationHook(hook);
    unregister();
    bus.publish(makeSentEvent());

    expect(hook).not.toHaveBeenCalled();
  });

  it("serialization hook receives a different event type correctly", () => {
    const bus = createEventBus();
    const hook = vi.fn();

    bus.registerSerializationHook(hook);
    bus.publish(makeAcceptedEvent());

    expect(hook).toHaveBeenCalledTimes(1);
    expect(hook.mock.calls[0][0].type).toBe("ORDER_ACCEPTED");
  });

  it("isolates handler errors — a failing handler does not block others", () => {
    const bus = createEventBus();
    const failingHandler = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });
    const stableHandler = vi.fn();

    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, failingHandler);
    bus.subscribe(ORDER_DOMAIN_EVENT.ORDER_SENT, stableHandler);

    expect(() => bus.publish(makeSentEvent())).not.toThrow();
    expect(stableHandler).toHaveBeenCalledTimes(1);
  });
});
