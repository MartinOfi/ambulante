import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { catalogService } from "@/features/catalog/services/catalog.mock";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import type { Product } from "@/shared/schemas/product";
import { useDeleteProductMutation } from "./useDeleteProductMutation";

vi.mock("@/features/catalog/services/catalog.mock", () => ({
  catalogService: {
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const STORE_ID = "store-1";
const PRODUCT_ID = "p-1";

const PRODUCT_A: Product = {
  id: PRODUCT_ID,
  storeId: STORE_ID,
  name: "Empanada de carne",
  priceArs: 500,
  isAvailable: true,
};

const PRODUCT_B: Product = {
  id: "p-2",
  storeId: STORE_ID,
  name: "Alfajor",
  priceArs: 300,
  isAvailable: true,
};

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

describe("useDeleteProductMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes the product from list cache optimistically before mutation resolves", async () => {
    let resolveDelete!: (value: void) => void;
    const pending = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    vi.mocked(catalogService.delete).mockReturnValueOnce(pending);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [PRODUCT_A, PRODUCT_B]);

    const { result } = renderHook(() => useDeleteProductMutation(), { wrapper });

    act(() => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    const optimistic = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(optimistic).toHaveLength(1);
    expect(optimistic?.[0].id).toBe("p-2");

    resolveDelete();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("rolls back list cache when mutation fails", async () => {
    vi.mocked(catalogService.delete).mockRejectedValueOnce(new Error("Delete failed"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [PRODUCT_A, PRODUCT_B]);

    const { result } = renderHook(() => useDeleteProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(rolledBack).toHaveLength(2);
    expect(rolledBack?.[0].id).toBe(PRODUCT_ID);
  });

  it("invalidates the catalog list cache on settled", async () => {
    vi.mocked(catalogService.delete).mockResolvedValueOnce(undefined);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.catalog.byStore(STORE_ID),
    });
  });

  it("calls logger.error with context when mutation fails", async () => {
    vi.mocked(catalogService.delete).mockRejectedValueOnce(new Error("Conflict"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useDeleteProductMutation: delete failed",
      expect.objectContaining({ error: "Conflict" }),
    );
  });
});
