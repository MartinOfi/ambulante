import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";
import type { Store } from "@/shared/types/store";
import { useStoreByIdQuery } from "./useStoreByIdQuery";

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/shared/services/stores", () => ({
  storesService: {
    findNearby: vi.fn(),
    findById: vi.fn(),
  },
}));

const MOCK_STORE: Store = {
  id: "store-1",
  name: "Empanadas Don Pedro",
  kind: "food-truck",
  status: "open",
  photoUrl: "https://example.com/store1.jpg",
  location: { lat: -34.604, lng: -58.382 },
  distanceMeters: 500,
  priceFromArs: 1200,
  tagline: "Las mejores empanadas del barrio",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStoreByIdQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when storeId is null (enabled = false)", () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreByIdQuery(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(storesService.findById).not.toHaveBeenCalled();
  });

  it("fetches store when storeId is provided and returns the service result", async () => {
    vi.mocked(storesService.findById).mockResolvedValueOnce(MOCK_STORE);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreByIdQuery("store-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_STORE);
    expect(storesService.findById).toHaveBeenCalledOnce();
    expect(storesService.findById).toHaveBeenCalledWith("store-1");
  });

  it("returns isLoading true while the fetch is in flight", async () => {
    let resolvePromise!: (value: Store | null) => void;
    const pending = new Promise<Store | null>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(storesService.findById).mockReturnValueOnce(pending);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreByIdQuery("store-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    resolvePromise(MOCK_STORE);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns isError true when the service rejects", async () => {
    vi.mocked(storesService.findById).mockRejectedValueOnce(new Error("Not found"));
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreByIdQuery("store-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useStoreByIdQuery: fetch failed",
      expect.objectContaining({ error: "Not found" }),
    );
  });
});
