import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { productsService } from "@/shared/services/products";
import { logger } from "@/shared/utils/logger";
import type { Product } from "@/shared/schemas/product";
import { useStoreProductsQuery } from "./useStoreProductsQuery";

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/shared/services/products", () => ({
  productsService: {
    findByStore: vi.fn(),
  },
}));

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: "prod-1",
    storeId: "store-1",
    name: "Empanada de carne",
    description: "Empanada jugosa con carne cortada a cuchillo",
    priceArs: 600,
    photoUrl: "https://example.com/prod1.jpg",
    isAvailable: true,
  },
  {
    id: "prod-2",
    storeId: "store-1",
    name: "Empanada de jamón y queso",
    priceArs: 550,
    isAvailable: true,
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

describe("useStoreProductsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when storeId is null (enabled = false)", () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProductsQuery(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(productsService.findByStore).not.toHaveBeenCalled();
  });

  it("fetches products when storeId is provided and returns the service result", async () => {
    vi.mocked(productsService.findByStore).mockResolvedValueOnce(MOCK_PRODUCTS);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProductsQuery("store-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_PRODUCTS);
    expect(productsService.findByStore).toHaveBeenCalledOnce();
    expect(productsService.findByStore).toHaveBeenCalledWith("store-1");
  });

  it("returns isLoading true while the fetch is in flight", async () => {
    let resolvePromise!: (value: readonly Product[]) => void;
    const pending = new Promise<readonly Product[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(productsService.findByStore).mockReturnValueOnce(pending);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProductsQuery("store-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    resolvePromise(MOCK_PRODUCTS);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns isError true when the service rejects", async () => {
    vi.mocked(productsService.findByStore).mockRejectedValueOnce(new Error("Service error"));
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreProductsQuery("store-1"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useStoreProductsQuery: fetch failed",
      expect.objectContaining({ error: "Service error" }),
    );
  });
});
