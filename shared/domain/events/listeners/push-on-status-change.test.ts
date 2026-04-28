import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEventBus, type EventBus } from "@/shared/domain/event-bus";
import {
  ORDER_DOMAIN_EVENT,
  type OrderAcceptedDomainEvent,
  type OrderCancelledDomainEvent,
  type OrderExpiredDomainEvent,
  type OrderFinishedDomainEvent,
  type OrderOnTheWayDomainEvent,
  type OrderReceivedDomainEvent,
  type OrderRejectedDomainEvent,
  type OrderSentDomainEvent,
} from "@/shared/domain/events";
import type { StoreRepository } from "@/shared/repositories";
import type { Store } from "@/shared/schemas/store";
import type { ServerPushSender } from "@/shared/services/push.types";

import { createPushOnStatusChangeListener } from "./push-on-status-change";

// ── Helpers ────────────────────────────────────────────────────────────────────

const CLIENT_ID = "client-uuid-1";
const STORE_ID = "store-uuid-1";
const OWNER_ID = "owner-uuid-1";
const ORDER_ID = "order-uuid-1";
const BASE_DATE = new Date("2026-04-28T10:00:00.000Z");
const LATER_DATE = new Date("2026-04-28T10:05:00.000Z");

function makeStore(id = STORE_ID, ownerId = OWNER_ID): Store {
  return {
    id,
    ownerId,
    name: "La Churrasquera",
    kind: "food-truck",
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.6, lng: -58.4 },
    distanceMeters: 100,
    status: "open",
    priceFromArs: 1500,
    tagline: "El mejor asado ambulante",
  };
}

function makeStoreRepo(store: Store | null = makeStore()): StoreRepository {
  return {
    findAll: vi.fn().mockResolvedValue(store ? [store] : []),
    findById: vi.fn().mockResolvedValue(store),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findNearby: vi.fn().mockResolvedValue([]),
    findByOwnerId: vi.fn().mockResolvedValue(store),
  };
}

function makePushSender(): { sendToUser: ReturnType<typeof vi.fn> } & ServerPushSender {
  return { sendToUser: vi.fn().mockResolvedValue(undefined) };
}

// Event factories
function makeSentEvent(): OrderSentDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_SENT,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: BASE_DATE,
    sentAt: BASE_DATE,
  };
}

function makeReceivedEvent(): OrderReceivedDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_RECEIVED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    receivedAt: LATER_DATE,
  };
}

function makeAcceptedEvent(): OrderAcceptedDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    receivedAt: BASE_DATE,
    acceptedAt: LATER_DATE,
  };
}

function makeRejectedEvent(): OrderRejectedDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_REJECTED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    receivedAt: BASE_DATE,
    rejectedAt: LATER_DATE,
  };
}

function makeOnTheWayEvent(): OrderOnTheWayDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    receivedAt: BASE_DATE,
    acceptedAt: BASE_DATE,
    onTheWayAt: LATER_DATE,
  };
}

function makeFinishedEvent(): OrderFinishedDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_FINISHED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    receivedAt: BASE_DATE,
    acceptedAt: BASE_DATE,
    onTheWayAt: BASE_DATE,
    finishedAt: LATER_DATE,
  };
}

function makeCancelledEvent(): OrderCancelledDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_CANCELLED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    cancelledAt: LATER_DATE,
  };
}

function makeExpiredEvent(): OrderExpiredDomainEvent {
  return {
    type: ORDER_DOMAIN_EVENT.ORDER_EXPIRED,
    orderId: ORDER_ID,
    clientId: CLIENT_ID,
    storeId: STORE_ID,
    occurredAt: LATER_DATE,
    sentAt: BASE_DATE,
    expiredAt: LATER_DATE,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("createPushOnStatusChangeListener", () => {
  let pushSender: ReturnType<typeof makePushSender>;
  let storeRepo: StoreRepository;
  let bus: EventBus;

  beforeEach(() => {
    pushSender = makePushSender();
    storeRepo = makeStoreRepo();
    bus = createEventBus();
    const listener = createPushOnStatusChangeListener({ pushSender, storeRepo });
    listener.register(bus);
  });

  describe("store-actor events — notifies the client", () => {
    it("sends push to clientId on ORDER_ACCEPTED", async () => {
      bus.publish(makeAcceptedEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        CLIENT_ID,
        expect.objectContaining({ title: expect.any(String), body: expect.any(String) }),
      );
    });

    it("sends push to clientId on ORDER_REJECTED", async () => {
      bus.publish(makeRejectedEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        CLIENT_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });

    it("sends push to clientId on ORDER_FINISHED", async () => {
      bus.publish(makeFinishedEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        CLIENT_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });
  });

  describe("system-actor events — notifies the client", () => {
    it("sends push to clientId on ORDER_RECEIVED", async () => {
      bus.publish(makeReceivedEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        CLIENT_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });

    it("sends push to clientId on ORDER_EXPIRED", async () => {
      bus.publish(makeExpiredEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        CLIENT_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });
  });

  describe("client-actor events — notifies the store owner", () => {
    it("sends push to store ownerId on ORDER_SENT", async () => {
      bus.publish(makeSentEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(storeRepo.findById).toHaveBeenCalledWith(STORE_ID);
      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        OWNER_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });

    it("sends push to store ownerId on ORDER_ON_THE_WAY", async () => {
      bus.publish(makeOnTheWayEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        OWNER_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });

    it("sends push to store ownerId on ORDER_CANCELLED", async () => {
      bus.publish(makeCancelledEvent());

      await vi.waitFor(() => expect(pushSender.sendToUser).toHaveBeenCalled());

      expect(pushSender.sendToUser).toHaveBeenCalledWith(
        OWNER_ID,
        expect.objectContaining({ title: expect.any(String) }),
      );
    });

    it("skips the push (no throw) when store is not found", async () => {
      const repoWithNoStore = makeStoreRepo(null);
      const isolatedBus = createEventBus();
      const listener = createPushOnStatusChangeListener({
        pushSender,
        storeRepo: repoWithNoStore,
      });
      listener.register(isolatedBus);

      isolatedBus.publish(makeSentEvent());

      // Allow async handler to settle — no push expected, no throw
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(pushSender.sendToUser).not.toHaveBeenCalled();
    });
  });

  it("unregistering stops all event subscriptions", async () => {
    const isolatedBus = createEventBus();
    const listener = createPushOnStatusChangeListener({ pushSender, storeRepo });
    const unregister = listener.register(isolatedBus);

    unregister();
    isolatedBus.publish(makeAcceptedEvent());

    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(pushSender.sendToUser).not.toHaveBeenCalled();
  });

  it("does not throw when pushSender.sendToUser rejects", async () => {
    const failingSender: ServerPushSender = {
      sendToUser: vi.fn().mockRejectedValue(new Error("network error")),
    };
    const isolatedBus = createEventBus();
    const listener = createPushOnStatusChangeListener({
      pushSender: failingSender,
      storeRepo,
    });
    listener.register(isolatedBus);

    // The event bus swallows handler errors — no throw expected
    expect(() => isolatedBus.publish(makeAcceptedEvent())).not.toThrow();
  });
});
