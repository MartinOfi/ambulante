import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ordersService } from "@/features/orders/services/orders.mock";
import { authService } from "@/shared/services/auth";
import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import type { Order } from "@/shared/schemas/order";
import { useFinalizeOrderMutation } from "./useFinalizeOrderMutation";

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: {
    accept: vi.fn(),
    reject: vi.fn(),
    finalize: vi.fn(),
  },
}));

vi.mock("@/shared/services/auth", () => ({
  authService: {
    getSession: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const MOCK_STORE_SESSION = {
  accessToken: "mock-token",
  refreshToken: "mock-refresh",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "store-1", email: "store@test.com", role: USER_ROLES.store },
};

const ORDER_ID = "order-789";

const MOCK_ITEM = {
  productId: "prod-1",
  productName: "Empanada",
  productPriceArs: 500,
  quantity: 2,
};

const MOCK_ORDER_EN_CAMINO: Order = {
  id: ORDER_ID,
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.EN_CAMINO,
  items: [MOCK_ITEM],
  createdAt: "2026-04-16T10:00:00.000Z",
  updatedAt: "2026-04-16T10:05:00.000Z",
};

const MOCK_ORDER_FINALIZADO: Order = {
  id: ORDER_ID,
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.FINALIZADO,
  items: [MOCK_ITEM],
  createdAt: "2026-04-16T10:00:00.000Z",
  updatedAt: "2026-04-16T10:30:00.000Z",
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

describe("useFinalizeOrderMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getSession).mockResolvedValue(MOCK_STORE_SESSION);
  });

  it("applies optimistic update immediately before mutation settles", async () => {
    let resolveFinalize!: (value: Order) => void;
    const pending = new Promise<Order>((resolve) => {
      resolveFinalize = resolve;
    });
    vi.mocked(ordersService.finalize).mockReturnValueOnce(pending);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.orders.byId(ORDER_ID), MOCK_ORDER_EN_CAMINO);

    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    act(() => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    const optimisticOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(ORDER_ID));
    expect(optimisticOrder?.status).toBe(ORDER_STATUS.FINALIZADO);

    resolveFinalize(MOCK_ORDER_FINALIZADO);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("invalidates both order caches after successful mutation", async () => {
    vi.mocked(ordersService.finalize).mockResolvedValueOnce(MOCK_ORDER_FINALIZADO);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.orders.byId(ORDER_ID),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.orders.all(),
    });
  });

  it("rolls back the cache to previous value when the mutation fails", async () => {
    vi.mocked(ordersService.finalize).mockRejectedValueOnce(new Error("Network error"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.orders.byId(ORDER_ID), MOCK_ORDER_EN_CAMINO);

    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBackOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(ORDER_ID));
    expect(rolledBackOrder?.status).toBe(ORDER_STATUS.EN_CAMINO);
  });

  it("throws and logs warn when session is null", async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe(
      "Unauthorized: only store role can finalize orders",
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "useFinalizeOrderMutation: unauthorized finalize attempt",
      expect.objectContaining({ orderId: ORDER_ID, role: null }),
    );
    expect(ordersService.finalize).not.toHaveBeenCalled();
  });

  it("throws and logs warn when user role is not store", async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce({
      ...MOCK_STORE_SESSION,
      user: { ...MOCK_STORE_SESSION.user, role: USER_ROLES.client },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.warn).toHaveBeenCalledWith(
      "useFinalizeOrderMutation: unauthorized finalize attempt",
      expect.objectContaining({ orderId: ORDER_ID, role: USER_ROLES.client }),
    );
    expect(ordersService.finalize).not.toHaveBeenCalled();
  });

  it("calls logger.error with orderId context when the mutation fails", async () => {
    vi.mocked(ordersService.finalize).mockRejectedValueOnce(new Error("Service unavailable"));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFinalizeOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(ORDER_ID);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "useFinalizeOrderMutation: finalize failed",
      expect.objectContaining({
        orderId: ORDER_ID,
        error: "Service unavailable",
      }),
    );
  });
});
