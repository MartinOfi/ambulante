import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ordersService } from "@/features/orders/services/orders.mock";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import { useOrdersQuery } from "./useOrdersQuery";

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: {
    accept: vi.fn(),
    findByUser: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const MOCK_ORDERS: readonly Order[] = [
  {
    id: "order-1",
    clientId: "user-123",
    storeId: "store-1",
    status: ORDER_STATUS.ENVIADO,
    items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 2 }],
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
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

describe("useOrdersQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when clientId is null (enabled = false)", () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useOrdersQuery({ clientId: null }), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(ordersService.findByUser).not.toHaveBeenCalled();
  });

  it("fetches orders when clientId is provided and returns the service result", async () => {
    vi.mocked(ordersService.findByUser).mockResolvedValueOnce(MOCK_ORDERS);
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useOrdersQuery({ clientId: "user-123" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(MOCK_ORDERS);
    expect(ordersService.findByUser).toHaveBeenCalledOnce();
    expect(ordersService.findByUser).toHaveBeenCalledWith({ clientId: "user-123", status: undefined });
  });

  it("returns isLoading true while fetch is in flight", async () => {
    let resolvePromise!: (value: readonly Order[]) => void;
    const pending = new Promise<readonly Order[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(ordersService.findByUser).mockReturnValueOnce(pending);
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useOrdersQuery({ clientId: "user-123" }),
      { wrapper },
    );

    expect(result.current.isLoading).toBe(true);

    resolvePromise(MOCK_ORDERS);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("returns isError true and logs when the service rejects", async () => {
    vi.mocked(ordersService.findByUser).mockRejectedValueOnce(new Error("Network error"));
    const wrapper = createWrapper();

    const { result } = renderHook(
      () => useOrdersQuery({ clientId: "user-123" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useOrdersQuery: fetch failed",
      expect.objectContaining({ error: "Network error" }),
    );
  });
});
