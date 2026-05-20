import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { realtimeService } from "@/shared/services/realtime";
import { useTableChangesInvalidation } from "./useTableChangesInvalidation";

vi.mock("@/shared/services/realtime", () => ({
  realtimeService: {
    subscribeToTableChanges: vi.fn(),
  },
}));

const mockSubscribeToTableChanges = vi.mocked(realtimeService.subscribeToTableChanges);

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

describe("useTableChangesInvalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to the given table and filter on mount", () => {
    mockSubscribeToTableChanges.mockReturnValue(() => undefined);

    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useTableChangesInvalidation({
          table: "orders",
          filter: "public_id=eq.abc",
          queryKey: ["orders", "abc"],
        }),
      { wrapper },
    );

    expect(mockSubscribeToTableChanges).toHaveBeenCalledOnce();
    expect(mockSubscribeToTableChanges).toHaveBeenCalledWith(
      "orders",
      "public_id=eq.abc",
      expect.any(Function),
    );
  });

  it("accepts null filter for table-wide subscriptions", () => {
    mockSubscribeToTableChanges.mockReturnValue(() => undefined);

    const { wrapper } = createWrapper();
    renderHook(
      () =>
        useTableChangesInvalidation({
          table: "orders",
          filter: null,
          queryKey: ["orders"],
        }),
      { wrapper },
    );

    expect(mockSubscribeToTableChanges).toHaveBeenCalledWith("orders", null, expect.any(Function));
  });

  it("calls invalidateQueries when a change is notified", () => {
    let capturedCallback: (() => void) | undefined;
    mockSubscribeToTableChanges.mockImplementation((_table, _filter, callback) => {
      capturedCallback = callback;
      return () => undefined;
    });

    const queryKey = ["orders", "by-id", "order-1"] as const;
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useTableChangesInvalidation({ table: "orders", filter: null, queryKey }), {
      wrapper,
    });

    capturedCallback?.();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });

  it("calls the returned unsubscribe function on unmount", () => {
    const unsubscribe = vi.fn();
    mockSubscribeToTableChanges.mockReturnValue(unsubscribe);

    const { wrapper } = createWrapper();
    const { unmount } = renderHook(
      () => useTableChangesInvalidation({ table: "orders", filter: null, queryKey: ["orders"] }),
      { wrapper },
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("re-subscribes when the filter changes", () => {
    const unsubscribe = vi.fn();
    mockSubscribeToTableChanges.mockReturnValue(unsubscribe);

    const { wrapper } = createWrapper();
    const { rerender } = renderHook(
      ({ filter }: { readonly filter: string | null }) =>
        useTableChangesInvalidation({ table: "orders", filter, queryKey: ["orders"] }),
      { initialProps: { filter: "public_id=eq.abc" }, wrapper },
    );

    expect(mockSubscribeToTableChanges).toHaveBeenCalledTimes(1);
    rerender({ filter: "public_id=eq.xyz" });
    expect(mockSubscribeToTableChanges).toHaveBeenCalledTimes(2);
  });
});
