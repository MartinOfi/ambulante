import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { catalogService } from "@/features/catalog/services/catalog.mock";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import type { Product } from "@/shared/schemas/product";
import type { EditProductValues } from "@/features/catalog/schemas/catalog.schemas";
import { useUpdateProductMutation } from "./useUpdateProductMutation";

vi.mock("@/features/catalog/services/catalog.mock", () => ({
  catalogService: {
    update: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const STORE_ID = "store-1";
const PRODUCT_ID = "p-1";

const ORIGINAL_PRODUCT: Product = {
  id: PRODUCT_ID,
  storeId: STORE_ID,
  name: "Empanada de carne",
  priceArs: 500,
  isAvailable: true,
};

const UPDATED_VALUES: EditProductValues = {
  name: "Empanada de carne premium",
  priceArs: 700,
  isAvailable: false,
};

const UPDATED_PRODUCT: Product = {
  ...ORIGINAL_PRODUCT,
  ...UPDATED_VALUES,
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

describe("useUpdateProductMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies optimistic update in the list cache before mutation resolves", async () => {
    let resolveUpdate!: (value: Product) => void;
    const pending = new Promise<Product>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(catalogService.update).mockReturnValueOnce(pending);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [ORIGINAL_PRODUCT]);

    const { result } = renderHook(() => useUpdateProductMutation(), { wrapper });

    act(() => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID, values: UPDATED_VALUES });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    const optimistic = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(optimistic?.[0].name).toBe(UPDATED_VALUES.name);
    expect(optimistic?.[0].priceArs).toBe(UPDATED_VALUES.priceArs);

    resolveUpdate(UPDATED_PRODUCT);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("rolls back list cache to previous state when mutation fails", async () => {
    vi.mocked(catalogService.update).mockRejectedValueOnce(new Error("Not found"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [ORIGINAL_PRODUCT]);

    const { result } = renderHook(() => useUpdateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID, values: UPDATED_VALUES });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(rolledBack?.[0].name).toBe(ORIGINAL_PRODUCT.name);
    expect(rolledBack?.[0].priceArs).toBe(ORIGINAL_PRODUCT.priceArs);
  });

  it("invalidates both list and item caches on settled", async () => {
    vi.mocked(catalogService.update).mockResolvedValueOnce(UPDATED_PRODUCT);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID, values: UPDATED_VALUES });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.catalog.byStore(STORE_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.catalog.byId(PRODUCT_ID),
    });
  });

  it("calls logger.error with productId context when mutation fails", async () => {
    vi.mocked(catalogService.update).mockRejectedValueOnce(new Error("Service unavailable"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, productId: PRODUCT_ID, values: UPDATED_VALUES });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useUpdateProductMutation: update failed",
      expect.objectContaining({ productId: PRODUCT_ID, error: "Service unavailable" }),
    );
  });
});
