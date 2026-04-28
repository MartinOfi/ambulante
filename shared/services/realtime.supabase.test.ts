import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RealtimeService } from "./realtime.types";
import { type SupabaseRealtimeClient, createSupabaseRealtimeService } from "./realtime.supabase";

// ── Mock builder ───────────────────────────────────────────────────────────────

type ChannelStatus = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

interface MockChannel {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  _triggerStatus(status: ChannelStatus): void;
  _triggerBroadcast(event: string, payload: unknown): void;
}

function createMockChannel(): MockChannel {
  let statusCb: ((status: string) => void) | null = null;
  let broadcastCb: ((data: { event: string; payload: unknown }) => void) | null = null;

  const channel: MockChannel = {
    on: vi.fn().mockImplementation((type: string, _filter: unknown, cb: unknown) => {
      if (type === "broadcast") {
        broadcastCb = cb as (data: { event: string; payload: unknown }) => void;
      }
      return channel;
    }),
    subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
      statusCb = cb;
      return channel;
    }),
    send: vi.fn().mockResolvedValue("ok"),
    _triggerStatus: (status) => statusCb?.(status),
    _triggerBroadcast: (event, payload) => broadcastCb?.({ event, payload }),
  };

  return channel;
}

interface MockClient extends SupabaseRealtimeClient {
  readonly lastChannel: MockChannel | null;
  readonly allChannels: MockChannel[];
}

function createMockClient(): MockClient {
  const allChannels: MockChannel[] = [];

  const client: MockClient = {
    get lastChannel() {
      return allChannels[allChannels.length - 1] ?? null;
    },
    get allChannels() {
      return allChannels;
    },
    channel: vi.fn().mockImplementation(() => {
      const ch = createMockChannel();
      allChannels.push(ch);
      return ch;
    }),
    removeChannel: vi.fn().mockResolvedValue("ok"),
  };

  return client;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("createSupabaseRealtimeService", () => {
  let mockClient: MockClient;
  let service: RealtimeService;

  beforeEach(() => {
    mockClient = createMockClient();
    service = createSupabaseRealtimeService(mockClient);
  });

  afterEach(() => {
    service.destroy();
    vi.clearAllTimers();
  });

  describe("initial state", () => {
    it("starts with 'connecting' status before any channel is SUBSCRIBED", () => {
      expect(service.status()).toBe("connecting");
    });
  });

  describe("subscribe", () => {
    it("creates a Supabase channel on first subscribe", () => {
      service.subscribe("orders:abc", () => {});
      expect(mockClient.channel).toHaveBeenCalledWith("orders:abc");
    });

    it("reuses the same Supabase channel for multiple subscribers on the same channel", () => {
      service.subscribe("orders:abc", () => {});
      service.subscribe("orders:abc", () => {});
      expect(mockClient.channel).toHaveBeenCalledTimes(1);
    });

    it("creates separate Supabase channels for different channel names", () => {
      service.subscribe("orders:abc", () => {});
      service.subscribe("stores:available", () => {});
      expect(mockClient.channel).toHaveBeenCalledTimes(2);
    });

    it("delivers broadcast events to the subscriber", () => {
      const received: unknown[] = [];
      service.subscribe("orders:abc", (msg) => received.push(msg));

      mockClient.lastChannel!._triggerBroadcast("ORDER_ACCEPTED", { orderId: "abc" });

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        channel: "orders:abc",
        event: "ORDER_ACCEPTED",
        payload: { orderId: "abc" },
      });
    });

    it("does not deliver to subscribers on a different channel", () => {
      const received: unknown[] = [];
      service.subscribe("stores:available", (msg) => received.push(msg));
      service.subscribe("orders:abc", () => {});

      mockClient.allChannels[1]._triggerBroadcast("ORDER_ACCEPTED", {});

      expect(received).toHaveLength(0);
    });

    it("isolates a throwing handler so other handlers still receive the message", () => {
      const received: unknown[] = [];
      service.subscribe("orders:abc", () => {
        throw new Error("crash");
      });
      service.subscribe("orders:abc", (msg) => received.push(msg));

      expect(() => mockClient.lastChannel!._triggerBroadcast("ORDER_SENT", {})).not.toThrow();
      expect(received).toHaveLength(1);
    });
  });

  describe("subscribe cleanup (returned unsubscribe fn)", () => {
    it("removes only the specific handler when called", () => {
      const first: unknown[] = [];
      const second: unknown[] = [];

      const unsub = service.subscribe("orders:abc", (msg) => first.push(msg));
      service.subscribe("orders:abc", (msg) => second.push(msg));

      unsub();
      mockClient.lastChannel!._triggerBroadcast("ORDER_SENT", {});

      expect(first).toHaveLength(0);
      expect(second).toHaveLength(1);
    });

    it("removes the Supabase channel when the last handler unsubscribes", () => {
      const unsub = service.subscribe("orders:abc", () => {});
      unsub();

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(1);
    });

    it("does not remove the Supabase channel if other handlers remain", () => {
      const unsub = service.subscribe("orders:abc", () => {});
      service.subscribe("orders:abc", () => {});

      unsub();

      expect(mockClient.removeChannel).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribe(channel)", () => {
    it("removes all handlers and the Supabase channel", () => {
      service.subscribe("orders:abc", () => {});
      service.subscribe("orders:abc", () => {});

      service.unsubscribe("orders:abc");

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(1);
    });

    it("is a no-op for a channel that was never subscribed", () => {
      expect(() => service.unsubscribe("orders:ghost")).not.toThrow();
      expect(mockClient.removeChannel).not.toHaveBeenCalled();
    });
  });

  describe("broadcast", () => {
    it("calls channel.send() with broadcast type", () => {
      service.subscribe("orders:abc", () => {});
      service.broadcast("orders:abc", "ORDER_UPDATED", { orderId: "abc" });

      expect(mockClient.lastChannel!.send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "ORDER_UPDATED",
        payload: { orderId: "abc" },
      });
    });

    it("does not throw when broadcast is called on an inactive channel", () => {
      expect(() => service.broadcast("orders:ghost", "EVENT", {})).not.toThrow();
    });
  });

  describe("status and onStatusChange", () => {
    it("transitions to 'online' when channel becomes SUBSCRIBED", () => {
      service.subscribe("orders:abc", () => {});
      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");

      expect(service.status()).toBe("online");
    });

    it("transitions to 'offline' when channel reports CHANNEL_ERROR", () => {
      service.subscribe("orders:abc", () => {});
      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");
      mockClient.lastChannel!._triggerStatus("CHANNEL_ERROR");

      expect(service.status()).toBe("offline");
    });

    it("notifies status listeners on transitions", () => {
      const statuses: string[] = [];
      service.onStatusChange((s) => statuses.push(s));
      service.subscribe("orders:abc", () => {});

      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");
      mockClient.lastChannel!._triggerStatus("CHANNEL_ERROR");

      expect(statuses).toContain("online");
      expect(statuses).toContain("offline");
    });

    it("returns cleanup fn that removes the status listener", () => {
      const statuses: string[] = [];
      const cleanup = service.onStatusChange((s) => statuses.push(s));
      cleanup();

      service.subscribe("orders:abc", () => {});
      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");

      expect(statuses).toHaveLength(0);
    });
  });

  describe("reconnect", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("is a no-op when already online", async () => {
      service.subscribe("orders:abc", () => {});
      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");

      service.reconnect();

      // Should not have created another channel
      expect(mockClient.channel).toHaveBeenCalledTimes(1);
    });

    it("triggers resubscribeAll with 'connecting' status when offline", async () => {
      const statuses: string[] = [];
      service.onStatusChange((s) => statuses.push(s));

      service.subscribe("orders:abc", () => {});
      mockClient.lastChannel!._triggerStatus("SUBSCRIBED");
      mockClient.lastChannel!._triggerStatus("CHANNEL_ERROR");

      statuses.length = 0; // reset after setup
      service.reconnect();

      expect(statuses[0]).toBe("connecting");
      expect(mockClient.channel).toHaveBeenCalledTimes(2); // original + resubscribe
    });
  });

  describe("destroy", () => {
    it("removes all active Supabase channels", () => {
      service.subscribe("orders:abc", () => {});
      service.subscribe("stores:available", () => {});

      service.destroy();

      expect(mockClient.removeChannel).toHaveBeenCalledTimes(2);
    });

    it("does not deliver events after destroy", () => {
      const received: unknown[] = [];
      service.subscribe("orders:abc", (msg) => received.push(msg));
      const ch = mockClient.lastChannel!;

      service.destroy();
      ch._triggerBroadcast("ORDER_ACCEPTED", {});

      expect(received).toHaveLength(0);
    });
  });
});
