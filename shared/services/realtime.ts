import type { EventBus } from "@/shared/domain/event-bus";
import { eventBus as defaultEventBus } from "@/shared/domain/event-bus";
import type { SerializedDomainEvent } from "@/shared/domain/events";
import {
  ORDER_EVENT_PREFIX,
  REALTIME_CHANNELS,
  RECONNECT_BACKOFF_FACTOR,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_MAX_DELAY_MS,
} from "@/shared/constants/realtime";
import { logger } from "@/shared/utils/logger";
import type {
  RealtimeHandler,
  RealtimeMessage,
  RealtimeService,
  RealtimeStatus,
  RealtimeStatusHandler,
  TestableRealtimeService,
} from "./realtime.types";

export type { RealtimeHandler, RealtimeMessage, RealtimeService, RealtimeStatus };
export type { RealtimeStatusHandler, TestableRealtimeService };
export { REALTIME_CHANNELS };
export type RealtimeChannel = (typeof REALTIME_CHANNELS)[keyof typeof REALTIME_CHANNELS];

// ── Channel routing ────────────────────────────────────────────────────────────

function resolveChannel(eventType: string): RealtimeChannel | null {
  if (eventType.startsWith(ORDER_EVENT_PREFIX)) return REALTIME_CHANNELS.ORDERS;
  return null;
}

// ── BroadcastChannel bridge ────────────────────────────────────────────────────

interface BroadcastPayload {
  readonly tabId: string;
  readonly channel: string;
  readonly event: string;
  readonly payload: unknown;
}

// ── Factory ────────────────────────────────────────────────────────────────────

interface CreateMockRealtimeServiceOptions {
  readonly eventBus?: EventBus;
  readonly broadcastChannel?: BroadcastChannel | null;
}

export function createMockRealtimeService({
  eventBus = defaultEventBus,
  broadcastChannel = null,
}: CreateMockRealtimeServiceOptions = {}): TestableRealtimeService {
  const channelHandlers = new Map<string, Set<RealtimeHandler>>();
  let statusListeners: ReadonlyArray<RealtimeStatusHandler> = [];
  let currentStatus: RealtimeStatus = "online";

  const tabId = Math.random().toString(36).slice(2);
  let destroyed = false;

  // Reconnect state
  let reconnecting = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  // Schedule the next reconnect attempt using exponential backoff.
  // When the timer fires, the attempt either succeeds (mock: always succeeds unless test
  // intervenes by calling _testSetStatus("offline")) or gives up after MAX_ATTEMPTS.
  function scheduleNextAttempt(): void {
    const delay = Math.min(
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** reconnectAttempt,
      RECONNECT_MAX_DELAY_MS,
    );

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectAttempt++;

      if (reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
        logger.error("Realtime: max reconnect attempts reached, staying offline");
        reconnecting = false;
        return;
      }

      performConnectAttempt();
    }, delay);
  }

  // Emit "connecting" and schedule an optimistic success.
  // The mock always succeeds after RECONNECT_INITIAL_DELAY_MS unless a test calls
  // _testSetStatus("offline") first, which cancels the success timer.
  function performConnectAttempt(): void {
    notifyStatusChange("connecting");

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (currentStatus === "connecting") {
        notifyStatusChange("online");
        reconnecting = false;
        reconnectAttempt = 0;
      }
    }, RECONNECT_INITIAL_DELAY_MS);
  }

  if (broadcastChannel !== null) {
    broadcastChannel.onmessage = (ev: MessageEvent<BroadcastPayload>) => {
      const { tabId: senderId, channel, event, payload } = ev.data;
      if (senderId === tabId) return;
      deliverToChannel(channel, event, payload);
    };
  }

  const unregisterSerializationHook = eventBus.registerSerializationHook(
    (serialized: SerializedDomainEvent) => {
      const channel = resolveChannel(serialized.type);
      if (!channel) return;
      deliverToChannel(channel, serialized.type, serialized);
      if (!destroyed && broadcastChannel !== null) {
        const msg: BroadcastPayload = {
          tabId,
          channel,
          event: serialized.type,
          payload: serialized,
        };
        broadcastChannel.postMessage(msg);
      }
    },
  );

  return {
    subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void {
      const existing = channelHandlers.get(channel);
      const handlers = existing ?? new Set<RealtimeHandler>();
      if (!existing) channelHandlers.set(channel, handlers);
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

    reconnect(): void {
      if (currentStatus === "online" || reconnecting) return;
      clearReconnectTimer();
      reconnecting = true;
      reconnectAttempt = 0;
      performConnectAttempt();
    },

    destroy(): void {
      destroyed = true;
      clearReconnectTimer();
      reconnecting = false;
      channelHandlers.clear();
      statusListeners = [];
      unregisterSerializationHook();
      if (broadcastChannel !== null) {
        broadcastChannel.onmessage = null;
        broadcastChannel.close();
      }
    },

    _testDeliver(channel: string, event: string, payload: unknown): void {
      deliverToChannel(channel, event, payload);
    },

    _testSetStatus(status: RealtimeStatus): void {
      if (status === "offline" && reconnecting) {
        clearReconnectTimer();
      }
      if (status === "online") {
        // Clear and reset before notifying so listener callbacks see clean state.
        clearReconnectTimer();
        reconnecting = false;
        reconnectAttempt = 0;
      }
      notifyStatusChange(status);
      if (status === "offline" && reconnecting) {
        scheduleNextAttempt();
      }
    },

    _testSimulateDisconnect(): void {
      clearReconnectTimer();
      reconnecting = true;
      reconnectAttempt = 0;
      notifyStatusChange("offline");
      scheduleNextAttempt();
    },
  };
}

// ── Singleton ──────────────────────────────────────────────────────────────────

const _broadcastChannel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("ambulante-realtime-mock")
    : null;

export const realtimeService: RealtimeService = createMockRealtimeService({
  broadcastChannel: _broadcastChannel,
});
