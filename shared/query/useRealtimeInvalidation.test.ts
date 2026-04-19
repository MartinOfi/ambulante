import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { realtimeService } from "@/shared/services/realtime";
import { useRealtimeInvalidation } from "./useRealtimeInvalidation";

vi.mock("@/shared/services/realtime", () => ({
  realtimeService: {
    subscribe: vi.fn(),
  },
}));

const mockSubscribe = vi.mocked(realtimeService.subscribe);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

describe("useRealtimeInvalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to the given channel on mount", () => {
    mockSubscribe.mockReturnValue(() => undefined);

    const { wrapper } = createWrapper();
    renderHook(() => useRealtimeInvalidation({ channel: "orders", queryKey: ["orders", "1"] }), {
      wrapper,
    });

    expect(mockSubscribe).toHaveBeenCalledOnce();
    expect(mockSubscribe).toHaveBeenCalledWith("orders", expect.any(Function));
  });

  it("calls invalidateQueries when a message arrives", () => {
    let capturedHandler: ((msg: unknown) => void) | undefined;
    mockSubscribe.mockImplementation((_channel, handler) => {
      capturedHandler = handler as (msg: unknown) => void;
      return () => undefined;
    });

    const queryKey = ["orders", "by-id", "order-1"] as const;
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useRealtimeInvalidation({ channel: "orders", queryKey }), { wrapper });

    capturedHandler?.({});

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });

  it("calls the returned unsubscribe function on unmount", () => {
    const unsubscribe = vi.fn();
    mockSubscribe.mockReturnValue(unsubscribe);

    const { wrapper } = createWrapper();
    const { unmount } = renderHook(
      () => useRealtimeInvalidation({ channel: "orders", queryKey: ["orders"] }),
      { wrapper },
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("re-subscribes when the channel changes", () => {
    const unsubscribe = vi.fn();
    mockSubscribe.mockReturnValue(unsubscribe);

    const { wrapper } = createWrapper();
    const { rerender } = renderHook(
      ({ channel }: { readonly channel: string }) =>
        useRealtimeInvalidation({ channel, queryKey: ["orders"] }),
      { initialProps: { channel: "orders" }, wrapper },
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    rerender({ channel: "stores" });
    expect(mockSubscribe).toHaveBeenCalledTimes(2);
  });
});
