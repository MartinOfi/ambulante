import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { queryKeys } from "@/shared/query/keys";
import { useTableChangesInvalidation } from "@/shared/query/useTableChangesInvalidation";
import { useOrderRealtime } from "./useOrderRealtime";

vi.mock("@/shared/query/useTableChangesInvalidation", () => ({
  useTableChangesInvalidation: vi.fn(),
}));

const mockUseTableChangesInvalidation = vi.mocked(useTableChangesInvalidation);

describe("useOrderRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to the orders table filtered by orderId", () => {
    renderHook(() => useOrderRealtime("order-abc"));

    expect(mockUseTableChangesInvalidation).toHaveBeenCalledOnce();
    expect(mockUseTableChangesInvalidation).toHaveBeenCalledWith({
      table: "orders",
      filter: "public_id=eq.order-abc",
      queryKey: queryKeys.orders.byId("order-abc"),
    });
  });

  it("uses the correct filter for a different orderId", () => {
    renderHook(() => useOrderRealtime("order-xyz"));

    expect(mockUseTableChangesInvalidation).toHaveBeenCalledWith({
      table: "orders",
      filter: "public_id=eq.order-xyz",
      queryKey: queryKeys.orders.byId("order-xyz"),
    });
  });

  it("passes updated filter when orderId changes", () => {
    const { rerender } = renderHook(
      ({ orderId }: { readonly orderId: string }) => useOrderRealtime(orderId),
      { initialProps: { orderId: "order-1" } },
    );

    rerender({ orderId: "order-2" });

    expect(mockUseTableChangesInvalidation).toHaveBeenCalledTimes(2);
    expect(mockUseTableChangesInvalidation).toHaveBeenLastCalledWith({
      table: "orders",
      filter: "public_id=eq.order-2",
      queryKey: queryKeys.orders.byId("order-2"),
    });
  });
});
