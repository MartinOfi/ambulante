import { logger } from "@/shared/utils/logger";
import {
  serializeEvent,
  type OrderDomainEvent,
  type OrderDomainEventType,
  type SerializedDomainEvent,
} from "./events";

// ── Types ──────────────────────────────────────────────────────────────────────

export type EventHandler<E extends OrderDomainEvent> = (event: E) => void;

// Called after every publish with the JSON-safe version of the event.
// F5 (realtime) registers here to push events to connected clients.
export type SerializationHook = (serialized: SerializedDomainEvent) => void;

// ── Interface ──────────────────────────────────────────────────────────────────

export interface EventBus {
  publish(event: OrderDomainEvent): void;
  subscribe<T extends OrderDomainEventType>(
    type: T,
    handler: EventHandler<Extract<OrderDomainEvent, { type: T }>>,
  ): () => void;
  registerSerializationHook(hook: SerializationHook): () => void;
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createEventBus(): EventBus {
  const handlers = new Map<OrderDomainEventType, ReadonlyArray<EventHandler<OrderDomainEvent>>>();
  let serializationHooks: ReadonlyArray<SerializationHook> = [];

  function publish(event: OrderDomainEvent): void {
    const eventHandlers = handlers.get(event.type) ?? [];
    for (const handler of eventHandlers) {
      try {
        handler(event);
      } catch (error: unknown) {
        logger.error("EventBus: handler threw an error", { eventType: event.type, error });
      }
    }

    const serialized = serializeEvent(event);
    for (const hook of serializationHooks) {
      try {
        hook(serialized);
      } catch (error: unknown) {
        logger.error("EventBus: serialization hook threw an error", {
          eventType: event.type,
          error,
        });
      }
    }
  }

  function subscribe<T extends OrderDomainEventType>(
    type: T,
    handler: EventHandler<Extract<OrderDomainEvent, { type: T }>>,
  ): () => void {
    const existing = handlers.get(type) ?? [];
    // Cast is safe: handler is EventHandler<Extract<...>> which is a subtype of EventHandler<OrderDomainEvent>
    handlers.set(type, [...existing, handler as EventHandler<OrderDomainEvent>]);

    return () => {
      const current = handlers.get(type) ?? [];
      handlers.set(
        type,
        current.filter((registered) => registered !== (handler as EventHandler<OrderDomainEvent>)),
      );
    };
  }

  function registerSerializationHook(hook: SerializationHook): () => void {
    serializationHooks = [...serializationHooks, hook];
    return () => {
      serializationHooks = serializationHooks.filter((registered) => registered !== hook);
    };
  }

  return { publish, subscribe, registerSerializationHook };
}

// ── Singleton ──────────────────────────────────────────────────────────────────

export const eventBus: EventBus = createEventBus();
