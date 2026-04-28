import { logger } from "@/shared/utils/logger";
import type { EventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT, type OrderDomainEvent } from "@/shared/domain/events";
import type { StoreRepository } from "@/shared/repositories/store";
import type { ServerPushSender, PushNotificationPayload } from "@/shared/services/push.types";

// ── Notification copy (UI copy in Spanish per CLAUDE.md) ──────────────────────

const PAYLOADS: Record<string, PushNotificationPayload> = {
  [ORDER_DOMAIN_EVENT.ORDER_SENT]: {
    title: "Nuevo pedido",
    body: "Tienes un nuevo pedido de un cliente",
  },
  [ORDER_DOMAIN_EVENT.ORDER_RECEIVED]: {
    title: "Pedido recibido",
    body: "Tu pedido fue recibido por la tienda",
  },
  [ORDER_DOMAIN_EVENT.ORDER_ACCEPTED]: {
    title: "¡Pedido aceptado!",
    body: "Tu pedido fue aceptado. ¡Ve a buscarlo!",
  },
  [ORDER_DOMAIN_EVENT.ORDER_REJECTED]: {
    title: "Pedido rechazado",
    body: "Lo sentimos, tu pedido fue rechazado por la tienda",
  },
  [ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY]: {
    title: "Cliente en camino",
    body: "El cliente va en camino hacia tu tienda",
  },
  [ORDER_DOMAIN_EVENT.ORDER_FINISHED]: {
    title: "¡Pedido finalizado!",
    body: "Tu pedido fue completado con éxito",
  },
  [ORDER_DOMAIN_EVENT.ORDER_CANCELLED]: {
    title: "Pedido cancelado",
    body: "El cliente canceló el pedido",
  },
  [ORDER_DOMAIN_EVENT.ORDER_EXPIRED]: {
    title: "Pedido expirado",
    body: "Tu pedido expiró sin respuesta de la tienda",
  },
};

// ── Routing helpers ────────────────────────────────────────────────────────────

// Events dispatched by the store actor — the client should be notified.
const STORE_ACTOR_EVENTS: ReadonlySet<string> = new Set([
  ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
  ORDER_DOMAIN_EVENT.ORDER_REJECTED,
  ORDER_DOMAIN_EVENT.ORDER_FINISHED,
]);

// Events dispatched by the client actor — the store owner should be notified.
const CLIENT_ACTOR_EVENTS: ReadonlySet<string> = new Set([
  ORDER_DOMAIN_EVENT.ORDER_SENT,
  ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY,
  ORDER_DOMAIN_EVENT.ORDER_CANCELLED,
]);

// ── Listener factory ──────────────────────────────────────────────────────────

interface PushListenerDeps {
  readonly pushSender: ServerPushSender;
  readonly storeRepo: StoreRepository;
}

export interface PushListener {
  register(bus: EventBus): () => void;
}

export function createPushOnStatusChangeListener({
  pushSender,
  storeRepo,
}: PushListenerDeps): PushListener {
  async function handleEvent(event: OrderDomainEvent): Promise<void> {
    const payload = PAYLOADS[event.type];
    if (payload === undefined) return;

    if (STORE_ACTOR_EVENTS.has(event.type) || !CLIENT_ACTOR_EVENTS.has(event.type)) {
      // Covers store-actor events AND system-actor events (RECEIVED, EXPIRED)
      await pushSender.sendToUser(event.clientId, payload);
      return;
    }

    // Client-actor events: resolve storeId → ownerId
    const store = await storeRepo.findById(event.storeId);
    if (store === null) {
      logger.warn("push-on-status-change: store not found, skipping push", {
        storeId: event.storeId,
        eventType: event.type,
      });
      return;
    }
    await pushSender.sendToUser(store.ownerId, payload);
  }

  function register(bus: EventBus): () => void {
    const unsubscribers = [
      ORDER_DOMAIN_EVENT.ORDER_SENT,
      ORDER_DOMAIN_EVENT.ORDER_RECEIVED,
      ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
      ORDER_DOMAIN_EVENT.ORDER_REJECTED,
      ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY,
      ORDER_DOMAIN_EVENT.ORDER_FINISHED,
      ORDER_DOMAIN_EVENT.ORDER_CANCELLED,
      ORDER_DOMAIN_EVENT.ORDER_EXPIRED,
    ].map((type) =>
      bus.subscribe(type, (event) => {
        void handleEvent(event).catch((err: unknown) => {
          logger.error("push-on-status-change: unhandled error", { error: err });
        });
      }),
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  return { register };
}
