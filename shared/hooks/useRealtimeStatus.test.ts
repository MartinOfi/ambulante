import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RealtimeService, RealtimeStatus } from "@/shared/services/realtime";
import { useRealtimeStatus } from "./useRealtimeStatus";

function makeMockService(initialStatus: RealtimeStatus = "online"): RealtimeService {
  let current = initialStatus;
  let listeners: ((s: RealtimeStatus) => void)[] = [];

  return {
    status: () => current,
    onStatusChange: (handler) => {
      listeners = [...listeners, handler];
      return () => {
        listeners = listeners.filter((l) => l !== handler);
      };
    },
    subscribe: vi.fn().mockReturnValue(() => {}),
    unsubscribe: vi.fn(),
    destroy: vi.fn(),
    reconnect: vi.fn(),
    _testDeliver: vi.fn(),
    _testSetStatus: (status) => {
      current = status;
      for (const listener of listeners) listener(status);
    },
    _testSimulateDisconnect: vi.fn(),
  };
}

describe("useRealtimeStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the service's current status on mount", () => {
    const svc = makeMockService("online");
    const { result } = renderHook(() => useRealtimeStatus(svc));
    expect(result.current).toBe("online");
  });

  it("returns offline when service starts offline", () => {
    const svc = makeMockService("offline");
    const { result } = renderHook(() => useRealtimeStatus(svc));
    expect(result.current).toBe("offline");
  });

  it("updates when service transitions to offline", () => {
    const svc = makeMockService("online");
    const { result } = renderHook(() => useRealtimeStatus(svc));

    act(() => svc._testSetStatus("offline"));

    expect(result.current).toBe("offline");
  });

  it("updates when service transitions to connecting", () => {
    const svc = makeMockService("offline");
    const { result } = renderHook(() => useRealtimeStatus(svc));

    act(() => svc._testSetStatus("connecting"));

    expect(result.current).toBe("connecting");
  });

  it("reflects multiple sequential transitions", () => {
    const svc = makeMockService("online");
    const { result } = renderHook(() => useRealtimeStatus(svc));

    act(() => svc._testSetStatus("offline"));
    expect(result.current).toBe("offline");

    act(() => svc._testSetStatus("connecting"));
    expect(result.current).toBe("connecting");

    act(() => svc._testSetStatus("online"));
    expect(result.current).toBe("online");
  });

  it("unsubscribes from status changes on unmount (no memory leak)", () => {
    const svc = makeMockService("online");
    const unsubscribeSpy = vi.fn();
    const originalOnStatusChange = svc.onStatusChange;
    svc.onStatusChange = vi.fn((handler) => {
      const cleanup = originalOnStatusChange(handler);
      return () => {
        unsubscribeSpy();
        cleanup();
      };
    });

    const { unmount } = renderHook(() => useRealtimeStatus(svc));
    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });

  it("no longer receives updates after unmount", () => {
    const svc = makeMockService("online");
    let renderCount = 0;

    const { unmount } = renderHook(() => {
      renderCount++;
      return useRealtimeStatus(svc);
    });

    const countBeforeUnmount = renderCount;
    unmount();

    act(() => svc._testSetStatus("offline"));

    // renderCount should not have increased after unmount
    expect(renderCount).toBe(countBeforeUnmount);
  });
});
