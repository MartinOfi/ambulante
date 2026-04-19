import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { catalogService } from "@/features/catalog/services/catalog.mock";
import { queryKeys } from "@/shared/query/keys";
import type { Product } from "@/shared/schemas/product";
import { useCatalogQuery } from "./useCatalogQuery";

vi.mock("@/features/catalog/services/catalog.mock", () => ({
  catalogService: {
    findByStore: vi.fn(),
  },
}));

const STORE_ID = "store-1";

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: "p-1",
    storeId: STORE_ID,
    name: "Empanada de carne",
    priceArs: 500,
    isAvailable: true,
  },
  {
    id: "p-2",
    storeId: STORE_ID,
    name: "Empanada de queso",
    priceArs: 400,
    isAvailable: false,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

describe("useCatalogQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns products for the given storeId", async () => {
    vi.mocked(catalogService.findByStore).mockResolvedValueOnce(MOCK_PRODUCTS);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogQuery(STORE_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe("Empanada de carne");
    expect(catalogService.findByStore).toHaveBeenCalledWith(STORE_ID);
  });

  it("uses the correct queryKey", async () => {
    vi.mocked(catalogService.findByStore).mockResolvedValueOnce([]);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogQuery(STORE_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData(queryKeys.catalog.byStore(STORE_ID));
    expect(cached).toBeDefined();
  });

  it("is disabled when storeId is empty", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogQuery(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(catalogService.findByStore).not.toHaveBeenCalled();
  });

  it("enters error state when service throws", async () => {
    vi.mocked(catalogService.findByStore).mockRejectedValueOnce(new Error("Network error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogQuery(STORE_ID), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
