import { createBrowserClient } from "@supabase/ssr";
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";
import type { RealtimeChannel as SupabaseChannel } from "@supabase/supabase-js";

import {
  RECONNECT_BACKOFF_FACTOR,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_MAX_DELAY_MS,
} from "@/shared/constants/realtime";
import { logger } from "@/shared/utils/logger";

import type {
  RealtimeHandler,
  RealtimeService,
  RealtimeStatus,
  RealtimeStatusHandler,
} from "./realtime.types";

// ── Seam for dependency injection (testability) ────────────────────────────────

export interface SupabaseRealtimeClient {
  channel(name: string): SupabaseChannel;
  removeChannel(channel: SupabaseChannel): Promise<"ok" | "timed out" | "error">;
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createSupabaseRealtimeService(client?: SupabaseRealtimeClient): RealtimeService {
  // Defer createBrowserClient to first use so the singleton can be safely
  // imported without env vars present (e.g. in test environments or SSR where
  // NEXT_PUBLIC_* vars are not loaded yet).
  let resolvedClient: SupabaseRealtimeClient | null = client ?? null;

  function getClient(): SupabaseRealtimeClient {
    if (!resolvedClient) {
      resolvedClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    }
    return resolvedClient;
  }

  const activeChannels = new Map<string, SupabaseChannel>();
  const channelHandlers = new Map<string, Set<RealtimeHandler>>();
  let statusListeners: ReadonlyArray<RealtimeStatusHandler> = [];
  let currentStatus: RealtimeStatus = "connecting";
  let destroyed = false;

  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingChannels = 0;

  // epoch increments on each resubscribeAll() to invalidate stale callbacks from
  // replaced channels that may still fire after removeChannel() is called (async).
  let epoch = 0;
  // tracks which channel names are still awaiting their SUBSCRIBED confirmation,
  // enabling correct pendingChannels adjustment when a channel is removed mid-flight.
  const pendingChannelNames = new Set<string>();

  function notifyStatus(status: RealtimeStatus): void {
    currentStatus = status;
    for (const listener of statusListeners) {
      try {
        listener(status);
      } catch (error: unknown) {
        logger.error("Realtime status listener threw", { status, error });
      }
    }
  }

  function deliverToHandlers(channelName: string, event: string, payload: unknown): void {
    const handlers = channelHandlers.get(channelName);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler({ channel: channelName, event, payload });
      } catch (error: unknown) {
        logger.error("Realtime handler threw", { channel: channelName, event, error });
      }
    }
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleNextAttempt(): void {
    const delay = Math.min(
      RECONNECT_INITIAL_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** reconnectAttempt,
      RECONNECT_MAX_DELAY_MS,
    );

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectAttempt++;

      if (reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
        logger.error("Realtime: max reconnect attempts reached");
        return;
      }

      resubscribeAll();
    }, delay);
  }

  function removePendingChannel(channelName: string): void {
    if (pendingChannelNames.has(channelName)) {
      pendingChannelNames.delete(channelName);
      pendingChannels = Math.max(0, pendingChannels - 1);
    }
  }

  function buildChannel(channelName: string): SupabaseChannel {
    const capturedEpoch = epoch;
    pendingChannelNames.add(channelName);
    pendingChannels++;
    return getClient()
      .channel(channelName)
      .on(
        REALTIME_LISTEN_TYPES.BROADCAST,
        { event: "*" },
        ({ event, payload }: { event: string; payload: unknown }) => {
          deliverToHandlers(channelName, event, payload);
        },
      )
      .subscribe((status: string) => {
        if (destroyed) return;
        // Stale callback from a channel replaced by resubscribeAll()
        if (capturedEpoch !== epoch) return;

        if (status === "SUBSCRIBED") {
          // Skip if the channel was unsubscribed before SUBSCRIBED arrived — its
          // pending slot was already released by removePendingChannel().
          if (!pendingChannelNames.has(channelName)) return;
          pendingChannelNames.delete(channelName);
          pendingChannels = Math.max(0, pendingChannels - 1);
          // Only emit "online" when all pending channels confirm AND no error
          // has already scheduled a backoff (a concurrent sibling channel error
          // sets reconnectTimer != null and pendingChannels = 0).
          if (pendingChannels === 0 && reconnectTimer === null) {
            notifyStatus("online");
            reconnectAttempt = 0;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Guard on timer so that errors during a resubscribe cycle can still
          // schedule the next attempt. Multiple simultaneous errors only schedule
          // one timer because the first one sets reconnectTimer != null.
          if (reconnectTimer === null) {
            notifyStatus("offline");
            pendingChannels = 0;
            pendingChannelNames.clear();
            scheduleNextAttempt();
          }
        }
      });
  }

  function resubscribeAll(): void {
    if (destroyed) return;
    // Bump epoch before building new channels so any SUBSCRIBED/ERROR callbacks
    // still in flight from the old channels are silently discarded.
    epoch++;
    notifyStatus("connecting");
    pendingChannels = 0;
    pendingChannelNames.clear();
    for (const channelName of channelHandlers.keys()) {
      const old = activeChannels.get(channelName);
      if (old) {
        getClient()
          .removeChannel(old)
          .catch((error: unknown) => {
            logger.error("Realtime: removeChannel failed during resubscribe", {
              channelName,
              error,
            });
          });
      }
      activeChannels.set(channelName, buildChannel(channelName));
    }
  }

  return {
    subscribe<T = unknown>(channelName: string, handler: RealtimeHandler<T>): () => void {
      const existing = channelHandlers.get(channelName);
      const handlers = existing ?? new Set<RealtimeHandler>();
      if (!existing) channelHandlers.set(channelName, handlers);
      handlers.add(handler as RealtimeHandler);

      if (!activeChannels.has(channelName)) {
        activeChannels.set(channelName, buildChannel(channelName));
      }

      return () => {
        handlers.delete(handler as RealtimeHandler);
        if (handlers.size === 0) {
          removePendingChannel(channelName);
          const ch = activeChannels.get(channelName);
          if (ch) {
            getClient()
              .removeChannel(ch)
              .catch((error: unknown) => {
                logger.error("Realtime: removeChannel failed on unsubscribe", {
                  channelName,
                  error,
                });
              });
            activeChannels.delete(channelName);
          }
          channelHandlers.delete(channelName);
        }
      };
    },

    unsubscribe(channelName: string): void {
      removePendingChannel(channelName);
      const ch = activeChannels.get(channelName);
      if (ch) {
        getClient()
          .removeChannel(ch)
          .catch((error: unknown) => {
            logger.error("Realtime: removeChannel failed on unsubscribe", { channelName, error });
          });
        activeChannels.delete(channelName);
      }
      channelHandlers.delete(channelName);
    },

    broadcast(channelName: string, event: string, payload: unknown): void {
      const ch = activeChannels.get(channelName);
      if (!ch) {
        logger.error("Realtime: broadcast on inactive channel", { channel: channelName, event });
        return;
      }
      ch.send({ type: "broadcast", event, payload }).catch((error: unknown) => {
        logger.error("Realtime: broadcast send failed", { channel: channelName, event, error });
      });
    },

    status(): RealtimeStatus {
      return currentStatus;
    },

    onStatusChange(handler: RealtimeStatusHandler): () => void {
      statusListeners = [...statusListeners, handler];
      return () => {
        statusListeners = statusListeners.filter((l) => l !== handler);
      };
    },

    reconnect(): void {
      if (destroyed) return;
      if (currentStatus === "online") return;
      // Force-restart even if backoff loop is already in progress; calling
      // reconnect() explicitly means "try immediately, reset the backoff".
      clearReconnectTimer();
      reconnectAttempt = 0;
      resubscribeAll();
    },

    destroy(): void {
      destroyed = true;
      clearReconnectTimer();
      pendingChannels = 0;
      pendingChannelNames.clear();
      for (const ch of activeChannels.values()) {
        getClient()
          .removeChannel(ch)
          .catch((error: unknown) => {
            logger.error("Realtime: removeChannel failed during destroy", { error });
          });
      }
      activeChannels.clear();
      channelHandlers.clear();
      statusListeners = [];
    },
  };
}

// ── Singleton ──────────────────────────────────────────────────────────────────

export const supabaseRealtimeService: RealtimeService = createSupabaseRealtimeService();
