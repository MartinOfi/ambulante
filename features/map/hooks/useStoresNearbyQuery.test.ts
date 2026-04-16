import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";
import type { Coordinates, Store } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";
import { useStoresNearbyQuery } from "./useStoresNearbyQuery";

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/shared/services/stores", () => ({
  storesService: {
    findNearby: vi.fn(),
    findById: vi.fn(),
  },
}));

const MOCK_COORDS: Coordinates = { lat: -34.6037, lng: -58.3816 };
const MOCK_RADIUS: RadiusValue = 2000;

const MOCK_STORES: readonly Store[] = [
  {
    id: "store-1",
    name: "Empanadas Don Pedro",
    kind: "food-truck",
    status: "open",
    photoUrl: "https://example.com/store1.jpg",
    location: { lat: -34.604, lng: -58.382 },
    distanceMeters: 500,
    priceFromArs: 1200,
    tagline: "Las mejores empanadas del barrio",
  },
  {
    id: "store-2",
    name: "Tacos El Mexicano",
    kind: "street-cart",
    status: "open",
    photoUrl: "https://example.com/store2.jpg",
    location: { lat: -34.605, lng: -58.383 },
    distanceMeters: 800,
    priceFromArs: 900,
    tagline: "Auténtica comida mexicana",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStoresNearbyQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when coords is null (enabled = false)", () => {
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useStoresNearbyQuery({ coords: null, radius: MOCK_RADIUS }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(storesService.findNearby).not.toHaveBeenCalled();
  });

  it("fetches stores when coords are provided and returns the service result", async () => {
    vi.mocked(storesService.findNearby).mockResolvedValueOnce(MOCK_STORES);
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useStoresNearbyQuery({ coords: MOCK_COORDS, radius: MOCK_RADIUS }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_STORES);
    expect(storesService.findNearby).toHaveBeenCalledOnce();
    expect(storesService.findNearby).toHaveBeenCalledWith({
      coords: MOCK_COORDS,
      radiusMeters: MOCK_RADIUS,
    });
  });

  it("returns isLoading true while the fetch is in flight", async () => {
    let resolvePromise!: (value: readonly Store[]) => void;
    const pending = new Promise<readonly Store[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(storesService.findNearby).mockReturnValueOnce(pending);
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useStoresNearbyQuery({ coords: MOCK_COORDS, radius: MOCK_RADIUS }),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);

    // Resolve to avoid hanging promise after test ends
    resolvePromise(MOCK_STORES);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns isError true when the service rejects", async () => {
    vi.mocked(storesService.findNearby).mockRejectedValueOnce(new Error("Network error"));
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useStoresNearbyQuery({ coords: MOCK_COORDS, radius: MOCK_RADIUS }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useStoresNearbyQuery: fetch failed",
      expect.objectContaining({ error: "Network error" }),
    );
  });
});
