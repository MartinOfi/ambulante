import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ordersService } from "@/features/orders/services/orders.mock";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order, OrderItem } from "@/shared/schemas/order";
import { useSendOrderMutation } from "./useSendOrderMutation";

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: {
    send: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const MOCK_ITEM: OrderItem = {
  productId: "prod-1",
  productName: "Empanada",
  productPriceArs: 500,
  quantity: 2,
};

const MOCK_ORDER_ENVIADO: Order = {
  id: "order-new-1",
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.ENVIADO,
  items: [MOCK_ITEM],
  createdAt: "2026-04-19T10:00:00.000Z",
  updatedAt: "2026-04-19T10:00:00.000Z",
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

describe("useSendOrderMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls ordersService.send with the given input", async () => {
    vi.mocked(ordersService.send).mockResolvedValueOnce(MOCK_ORDER_ENVIADO);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", items: [MOCK_ITEM] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(ordersService.send).toHaveBeenCalledWith({ storeId: "store-1", items: [MOCK_ITEM] });
  });

  it("returns the new order on success", async () => {
    vi.mocked(ordersService.send).mockResolvedValueOnce(MOCK_ORDER_ENVIADO);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", items: [MOCK_ITEM] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_ORDER_ENVIADO);
  });

  it("invalidates orders.all() after success", async () => {
    vi.mocked(ordersService.send).mockResolvedValueOnce(MOCK_ORDER_ENVIADO);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", items: [MOCK_ITEM] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orders.all() });
  });

  it("sets isError and logs on failure", async () => {
    vi.mocked(ordersService.send).mockRejectedValueOnce(new Error("Network error"));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", items: [MOCK_ITEM] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logger.error).toHaveBeenCalledWith(
      "useSendOrderMutation: send failed",
      expect.objectContaining({ error: "Network error" }),
    );
  });
});
