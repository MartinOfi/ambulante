import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ordersService } from "@/features/orders/services/orders.mock";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import { useStoreOrdersQuery } from "./useStoreOrdersQuery";

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: {
    findByStore: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/shared/query/useRealtimeInvalidation", () => ({
  useRealtimeInvalidation: vi.fn(),
}));

const STORE_ID = "store-demo-1";

const MOCK_STORE_ORDERS: readonly Order[] = [
  {
    id: "order-store-1",
    clientId: "client-1",
    storeId: STORE_ID,
    status: ORDER_STATUS.ENVIADO,
    items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 }],
    createdAt: "2026-04-20T10:00:00.000Z",
    updatedAt: "2026-04-20T10:00:00.000Z",
  },
  {
    id: "order-store-2",
    clientId: "client-2",
    storeId: STORE_ID,
    status: ORDER_STATUS.RECIBIDO,
    items: [{ productId: "p2", productName: "Choripán", productPriceArs: 1200, quantity: 1 }],
    createdAt: "2026-04-20T09:00:00.000Z",
    updatedAt: "2026-04-20T09:00:00.000Z",
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

describe("useStoreOrdersQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when storeId is null", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useStoreOrdersQuery({ storeId: null }), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(ordersService.findByStore).not.toHaveBeenCalled();
  });

  it("fetches orders by storeId and returns them sorted by createdAt descending", async () => {
    vi.mocked(ordersService.findByStore).mockResolvedValueOnce(MOCK_STORE_ORDERS);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreOrdersQuery({ storeId: STORE_ID }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    const data = result.current.data!;
    expect(data[0].id).toBe("order-store-1");
    expect(data[1].id).toBe("order-store-2");
    expect(ordersService.findByStore).toHaveBeenCalledWith({
      storeId: STORE_ID,
      status: undefined,
    });
  });

  it("passes status filter to the service when provided", async () => {
    vi.mocked(ordersService.findByStore).mockResolvedValueOnce([MOCK_STORE_ORDERS[0]]);
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useStoreOrdersQuery({ storeId: STORE_ID, status: ORDER_STATUS.ENVIADO }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(ordersService.findByStore).toHaveBeenCalledWith({
      storeId: STORE_ID,
      status: ORDER_STATUS.ENVIADO,
    });
  });

  it("logs and returns isError on service failure", async () => {
    vi.mocked(ordersService.findByStore).mockRejectedValueOnce(new Error("Service down"));
    const wrapper = createWrapper();

    const { result } = renderHook(() => useStoreOrdersQuery({ storeId: STORE_ID }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledWith(
      "useStoreOrdersQuery: fetch failed",
      expect.objectContaining({ error: "Service down" }),
    );
  });
});
