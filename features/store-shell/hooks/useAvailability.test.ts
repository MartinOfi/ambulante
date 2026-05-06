import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAvailabilityStore } from "@/features/store-shell/stores/availability.store";

vi.mock("@/shared/hooks/useCurrentStoreQuery", () => ({
  useCurrentStoreQuery: vi.fn(),
}));

vi.mock("@/shared/services/stores", () => ({
  storesService: {
    updateAvailability: vi.fn(),
  },
}));

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { storesService } from "@/shared/services/stores";
import { useAvailability } from "./useAvailability";

const MOCK_STORE_ID = "10000000-0000-4000-8000-000000000001";

function makeStore(status: "open" | "closed" | "stale") {
  return {
    id: MOCK_STORE_ID,
    name: "Test Store",
    kind: "food-truck" as const,
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.6, lng: -58.38 },
    distanceMeters: 0,
    status,
    priceFromArs: 500,
    tagline: "Test",
    ownerId: "user-1",
  };
}

describe("useAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAvailabilityStore.setState({ isAvailable: false });
    vi.mocked(storesService.updateAvailability).mockResolvedValue(undefined);
  });

  describe("server-state initialization", () => {
    it("syncs isAvailable=true when server status is open", async () => {
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: makeStore("open"),
        isPending: false,
      } as ReturnType<typeof useCurrentStoreQuery>);

      const { result } = renderHook(() => useAvailability());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
    });

    it("syncs isAvailable=false when server status is closed", async () => {
      useAvailabilityStore.setState({ isAvailable: true });
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: makeStore("closed"),
        isPending: false,
      } as ReturnType<typeof useCurrentStoreQuery>);

      const { result } = renderHook(() => useAvailability());

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
      });
    });

    it("does not change local state when store is not loaded", () => {
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: undefined,
        isPending: true,
      } as ReturnType<typeof useCurrentStoreQuery>);

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(false);
    });
  });

  describe("toggle — optimistic update", () => {
    beforeEach(() => {
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: makeStore("closed"),
        isPending: false,
      } as ReturnType<typeof useCurrentStoreQuery>);
    });

    it("flips state immediately before server responds", async () => {
      vi.mocked(storesService.updateAvailability).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAvailability());
      await waitFor(() => expect(result.current.isAvailable).toBe(false));

      act(() => result.current.toggle());
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isPending).toBe(true);
    });

    it("calls updateAvailability with next value", async () => {
      const { result } = renderHook(() => useAvailability());
      await waitFor(() => expect(result.current.isAvailable).toBe(false));

      await act(() => {
        result.current.toggle();
      });

      expect(storesService.updateAvailability).toHaveBeenCalledWith(MOCK_STORE_ID, true);
    });

    it("clears isPending after server resolves", async () => {
      const { result } = renderHook(() => useAvailability());
      await waitFor(() => expect(result.current.isAvailable).toBe(false));

      await act(async () => {
        result.current.toggle();
      });

      expect(result.current.isPending).toBe(false);
    });

    it("rolls back optimistic update on server error", async () => {
      vi.mocked(storesService.updateAvailability).mockRejectedValue(new Error("network"));

      const { result } = renderHook(() => useAvailability());
      await waitFor(() => expect(result.current.isAvailable).toBe(false));

      await act(async () => {
        result.current.toggle();
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isPending).toBe(false);
    });

    it("ignores toggle when storeId is not available", async () => {
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: undefined,
        isPending: true,
      } as ReturnType<typeof useCurrentStoreQuery>);

      const { result } = renderHook(() => useAvailability());

      act(() => result.current.toggle());

      expect(storesService.updateAvailability).not.toHaveBeenCalled();
    });
  });

  describe("setAvailable", () => {
    it("sets value directly without server call", async () => {
      vi.mocked(useCurrentStoreQuery).mockReturnValue({
        data: makeStore("closed"),
        isPending: false,
      } as ReturnType<typeof useCurrentStoreQuery>);

      const { result } = renderHook(() => useAvailability());
      await waitFor(() => expect(result.current.isAvailable).toBe(false));

      act(() => result.current.setAvailable(true));

      expect(result.current.isAvailable).toBe(true);
      expect(storesService.updateAvailability).not.toHaveBeenCalled();
    });
  });
});
