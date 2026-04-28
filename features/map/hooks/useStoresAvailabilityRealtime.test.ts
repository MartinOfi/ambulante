import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { REALTIME_CHANNELS } from "@/shared/constants/realtime";
import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";
import { useStoresAvailabilityRealtime } from "./useStoresAvailabilityRealtime";

vi.mock("@/shared/query/useRealtimeInvalidation", () => ({
  useRealtimeInvalidation: vi.fn(),
}));

const mockUseRealtimeInvalidation = vi.mocked(useRealtimeInvalidation);

describe("useStoresAvailabilityRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to the stores channel", () => {
    renderHook(() => useStoresAvailabilityRealtime());

    expect(mockUseRealtimeInvalidation).toHaveBeenCalledOnce();
    expect(mockUseRealtimeInvalidation).toHaveBeenCalledWith({
      channel: REALTIME_CHANNELS.STORES,
      queryKey: queryKeys.stores.all(),
    });
  });

  it("always targets the stores.all() query key (invalidates all store queries)", () => {
    renderHook(() => useStoresAvailabilityRealtime());

    const call = mockUseRealtimeInvalidation.mock.calls[0][0];
    expect(call.queryKey).toEqual(queryKeys.stores.all());
    expect(call.queryKey).toEqual(["stores"]);
  });
});
