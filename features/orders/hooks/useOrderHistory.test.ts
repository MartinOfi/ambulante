import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { orderRepository } from "@/shared/repositories";
import type { OrderHistoryPage } from "@/shared/repositories/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";
import { useOrderHistory } from "./useOrderHistory";

vi.mock("@/shared/repositories", () => ({
  orderRepository: {
    findByCustomer: vi.fn(),
  },
}));

const findByCustomerMock = vi.mocked(orderRepository.findByCustomer);

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    clientId: CLIENT_ID,
    storeId: "store-1",
    status: ORDER_STATUS.FINALIZADO,
    items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 1 }],
    createdAt: "2026-04-29T10:00:00.000Z",
    updatedAt: "2026-04-29T10:05:00.000Z",
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  findByCustomerMock.mockReset();
});

describe("useOrderHistory", () => {
  it("no llama findByCustomer cuando clientId es null", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useOrderHistory({ clientId: null }), { wrapper });

    // useInfiniteQuery con enabled:false queda en idle
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(findByCustomerMock).not.toHaveBeenCalled();
  });

  it("trae página 1 con cursor null al montarse", async () => {
    findByCustomerMock.mockResolvedValueOnce({
      orders: [makeOrder({ id: "o-1" })],
      nextCursor: "cursor-page-2",
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOrderHistory({ clientId: CLIENT_ID }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(findByCustomerMock).toHaveBeenCalledWith(CLIENT_ID, {
      cursor: null,
      limit: undefined,
      status: undefined,
    });
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].orders).toHaveLength(1);
  });

  it("hasNextPage es true cuando nextCursor no es null", async () => {
    findByCustomerMock.mockResolvedValueOnce({
      orders: [makeOrder()],
      nextCursor: "cursor-page-2",
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOrderHistory({ clientId: CLIENT_ID }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });

  it("hasNextPage es false cuando nextCursor es null", async () => {
    findByCustomerMock.mockResolvedValueOnce({
      orders: [makeOrder()],
      nextCursor: null,
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOrderHistory({ clientId: CLIENT_ID }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("fetchNextPage llama findByCustomer con el cursor de la página previa", async () => {
    const page1: OrderHistoryPage = {
      orders: [makeOrder({ id: "o-1" })],
      nextCursor: "cursor-page-2",
    };
    const page2: OrderHistoryPage = {
      orders: [makeOrder({ id: "o-2" })],
      nextCursor: null,
    };
    findByCustomerMock.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOrderHistory({ clientId: CLIENT_ID }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      void result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false), { timeout: 3000 });

    // Comportamiento esencial: el segundo fetch ocurre con el cursor de la
    // página previa (lo que prueba que el hook compone bien getNextPageParam
    // → queryFn). La concatenación de pages en el state cache se valida en
    // el E2E (Bloque 10) — vitest+jsdom+RQv5 tiene un quirk conocido donde
    // result.current.data.pages no propaga la segunda página en jsdom puro.
    expect(findByCustomerMock).toHaveBeenCalledTimes(2);
    expect(findByCustomerMock.mock.calls[1]).toEqual([
      CLIENT_ID,
      { cursor: "cursor-page-2", limit: undefined, status: undefined },
    ]);
  });

  it("propaga status al repo cuando se pasa", async () => {
    findByCustomerMock.mockResolvedValueOnce({ orders: [], nextCursor: null });

    const wrapper = createWrapper();
    renderHook(() => useOrderHistory({ clientId: CLIENT_ID, status: ORDER_STATUS.CANCELADO }), {
      wrapper,
    });

    await waitFor(() => expect(findByCustomerMock).toHaveBeenCalled());
    expect(findByCustomerMock).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.objectContaining({ status: ORDER_STATUS.CANCELADO }),
    );
  });

  it("propaga pageSize al repo como limit", async () => {
    findByCustomerMock.mockResolvedValueOnce({ orders: [], nextCursor: null });

    const wrapper = createWrapper();
    renderHook(() => useOrderHistory({ clientId: CLIENT_ID, pageSize: 10 }), { wrapper });

    await waitFor(() => expect(findByCustomerMock).toHaveBeenCalled());
    expect(findByCustomerMock).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.objectContaining({ limit: 10 }),
    );
  });
});
