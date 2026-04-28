import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { REALTIME_CHANNELS } from "@/shared/constants/realtime";
import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";
import { useOrderRealtime } from "./useOrderRealtime";

vi.mock("@/shared/query/useRealtimeInvalidation", () => ({
  useRealtimeInvalidation: vi.fn(),
}));

const mockUseRealtimeInvalidation = vi.mocked(useRealtimeInvalidation);

describe("useOrderRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to the orders channel for the given orderId", () => {
    renderHook(() => useOrderRealtime("order-abc"));

    expect(mockUseRealtimeInvalidation).toHaveBeenCalledOnce();
    expect(mockUseRealtimeInvalidation).toHaveBeenCalledWith({
      channel: REALTIME_CHANNELS.ORDERS,
      queryKey: queryKeys.orders.byId("order-abc"),
    });
  });

  it("uses the correct query key for a different orderId", () => {
    renderHook(() => useOrderRealtime("order-xyz"));

    expect(mockUseRealtimeInvalidation).toHaveBeenCalledWith({
      channel: REALTIME_CHANNELS.ORDERS,
      queryKey: queryKeys.orders.byId("order-xyz"),
    });
  });

  it("passes updated query key when orderId changes", () => {
    const { rerender } = renderHook(
      ({ orderId }: { readonly orderId: string }) => useOrderRealtime(orderId),
      { initialProps: { orderId: "order-1" } },
    );

    rerender({ orderId: "order-2" });

    expect(mockUseRealtimeInvalidation).toHaveBeenCalledTimes(2);
    expect(mockUseRealtimeInvalidation).toHaveBeenLastCalledWith({
      channel: REALTIME_CHANNELS.ORDERS,
      queryKey: queryKeys.orders.byId("order-2"),
    });
  });
});
