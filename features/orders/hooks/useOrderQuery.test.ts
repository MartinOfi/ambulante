import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ordersService } from "@/features/orders/services/orders.mock";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { useOrderQuery } from "./useOrderQuery";

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: {
    getById: vi.fn(),
  },
}));

const ORDER_ID = "order-123";

const MOCK_ORDER: Order = {
  id: ORDER_ID,
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.ACEPTADO,
  items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 1 }],
  createdAt: "2026-04-19T10:00:00.000Z",
  updatedAt: "2026-04-19T10:01:00.000Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}

describe("useOrderQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls ordersService.getById with the given orderId", async () => {
    vi.mocked(ordersService.getById).mockResolvedValueOnce(MOCK_ORDER);
    const { wrapper } = createWrapper();

    renderHook(() => useOrderQuery(ORDER_ID), { wrapper });

    await waitFor(() => expect(ordersService.getById).toHaveBeenCalledWith(ORDER_ID));
  });

  it("returns order data on success", async () => {
    vi.mocked(ordersService.getById).mockResolvedValueOnce(MOCK_ORDER);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOrderQuery(ORDER_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_ORDER);
  });

  it("returns null when order is not found", async () => {
    vi.mocked(ordersService.getById).mockResolvedValueOnce(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOrderQuery(ORDER_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("exposes isError when the service throws", async () => {
    vi.mocked(ordersService.getById).mockRejectedValueOnce(new Error("Not found"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOrderQuery(ORDER_ID), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
