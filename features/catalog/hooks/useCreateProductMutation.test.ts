import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { catalogService } from "@/features/catalog/services/catalog.mock";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import type { Product } from "@/shared/schemas/product";
import type { CreateProductValues } from "@/features/catalog/schemas/catalog.schemas";
import { useCreateProductMutation } from "./useCreateProductMutation";

vi.mock("@/features/catalog/services/catalog.mock", () => ({
  catalogService: {
    create: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const STORE_ID = "store-1";

const VALID_VALUES: CreateProductValues = {
  name: "Empanada de carne",
  priceArs: 500,
  isAvailable: true,
};

const CREATED_PRODUCT: Product = {
  id: "new-id",
  storeId: STORE_ID,
  name: "Empanada de carne",
  priceArs: 500,
  isAvailable: true,
};

const EXISTING_PRODUCT: Product = {
  id: "existing-id",
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

describe("useCreateProductMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies an optimistic product immediately before mutation resolves", async () => {
    let resolveCreate!: (value: Product) => void;
    const pending = new Promise<Product>((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(catalogService.create).mockReturnValueOnce(pending);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [EXISTING_PRODUCT]);

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    act(() => {
      result.current.mutate({ storeId: STORE_ID, values: VALID_VALUES });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    const optimistic = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(optimistic).toHaveLength(2);
    expect(optimistic?.at(-1)?.name).toBe(VALID_VALUES.name);

    resolveCreate(CREATED_PRODUCT);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("rolls back the cache to previous state when mutation fails", async () => {
    vi.mocked(catalogService.create).mockRejectedValueOnce(new Error("Service error"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.catalog.byStore(STORE_ID), [EXISTING_PRODUCT]);

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, values: VALID_VALUES });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = queryClient.getQueryData<Product[]>(queryKeys.catalog.byStore(STORE_ID));
    expect(rolledBack).toHaveLength(1);
    expect(rolledBack?.[0].id).toBe("existing-id");
  });

  it("invalidates the catalog cache on settled", async () => {
    vi.mocked(catalogService.create).mockResolvedValueOnce(CREATED_PRODUCT);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, values: VALID_VALUES });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.catalog.byStore(STORE_ID),
    });
  });

  it("calls logger.error with context when mutation fails", async () => {
    vi.mocked(catalogService.create).mockRejectedValueOnce(new Error("Timeout"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: STORE_ID, values: VALID_VALUES });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useCreateProductMutation: create failed",
      expect.objectContaining({ error: "Timeout" }),
    );
  });
});
