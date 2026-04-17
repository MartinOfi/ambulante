import type { EventBus } from "@/shared/domain/event-bus";
import { eventBus as defaultEventBus } from "@/shared/domain/event-bus";
import type { SerializedDomainEvent } from "@/shared/domain/events";
import { logger } from "@/shared/utils/logger";
import type {
  RealtimeHandler,
  RealtimeMessage,
  RealtimeService,
  RealtimeStatus,
  RealtimeStatusHandler,
} from "./realtime.types";

export type { RealtimeHandler, RealtimeMessage, RealtimeService, RealtimeStatus };
export type { RealtimeStatusHandler };

// ── Channel constants ──────────────────────────────────────────────────────────

export const REALTIME_CHANNELS = Object.freeze({
  orders: "orders",
  stores: "stores",
} as const);

export type RealtimeChannel = (typeof REALTIME_CHANNELS)[keyof typeof REALTIME_CHANNELS];

// ── Channel routing ────────────────────────────────────────────────────────────

// Domain event types that belong to the orders channel
const ORDER_EVENT_PREFIX = "ORDER_";

function resolveChannel(eventType: string): RealtimeChannel | null {
  if (eventType.startsWith(ORDER_EVENT_PREFIX)) return REALTIME_CHANNELS.orders;
  return null;
}

// ── Factory ────────────────────────────────────────────────────────────────────

interface CreateMockRealtimeServiceOptions {
  readonly eventBus?: EventBus;
}

export function createMockRealtimeService({
  eventBus = defaultEventBus,
}: CreateMockRealtimeServiceOptions = {}): RealtimeService {
  const channelHandlers = new Map<string, Set<RealtimeHandler>>();
  let statusListeners: ReadonlyArray<RealtimeStatusHandler> = [];
  let currentStatus: RealtimeStatus = "online";

  function deliverToChannel(channel: string, event: string, payload: unknown): void {
    const handlers = channelHandlers.get(channel);
    if (!handlers) return;
    const message: RealtimeMessage<unknown> = { channel, event, payload };
    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error: unknown) {
        logger.error("Realtime handler threw an error", { channel, event, error });
      }
    }
  }

  function notifyStatusChange(status: RealtimeStatus): void {
    currentStatus = status;
    for (const listener of statusListeners) {
      try {
        listener(status);
      } catch (error: unknown) {
        logger.error("Realtime status listener threw an error", { status, error });
      }
    }
  }

  // Forward domain events from the event bus to the appropriate realtime channel.
  // F5 (realtime) registers here so serialized events reach connected clients.
  const unregisterSerializationHook = eventBus.registerSerializationHook(
    (serialized: SerializedDomainEvent) => {
      const channel = resolveChannel(serialized.type);
      if (!channel) return;
      deliverToChannel(channel, serialized.type, serialized);
    },
  );

  return {
    subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void {
      if (!channelHandlers.has(channel)) {
        channelHandlers.set(channel, new Set());
      }
      const handlers = channelHandlers.get(channel)!;
      handlers.add(handler as RealtimeHandler);
      return () => {
        handlers.delete(handler as RealtimeHandler);
      };
    },

    unsubscribe(channel: string): void {
      channelHandlers.delete(channel);
    },

    status(): RealtimeStatus {
      return currentStatus;
    },

    onStatusChange(handler: RealtimeStatusHandler): () => void {
      statusListeners = [...statusListeners, handler];
      return () => {
        statusListeners = statusListeners.filter((registered) => registered !== handler);
      };
    },

    destroy(): void {
      channelHandlers.clear();
      statusListeners = [];
      unregisterSerializationHook();
    },

    _testDeliver(channel: string, event: string, payload: unknown): void {
      deliverToChannel(channel, event, payload);
    },

    _testSetStatus(status: RealtimeStatus): void {
      notifyStatusChange(status);
    },
  };
}

// ── Singleton ──────────────────────────────────────────────────────────────────

export const realtimeService: RealtimeService = createMockRealtimeService();
