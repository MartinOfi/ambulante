import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { useCancelOrderMutation } from "./useCancelOrderMutation";
import { authService } from "@/shared/services/auth";
import { ordersService } from "@/features/orders/services/orders.mock";
import { ORDER_STATUS } from "@/shared/constants/order";
import { queryKeys } from "@/shared/query/keys";
import type { OrderEnviado } from "@/shared/domain/order-state-machine";

vi.mock("@/shared/services/auth", () => ({
  authService: { getSession: vi.fn() },
}));

vi.mock("@/features/orders/services/orders.mock", () => ({
  ordersService: { accept: vi.fn(), cancel: vi.fn() },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const mockGetSession = vi.mocked(authService.getSession);
const mockCancel = vi.mocked(ordersService.cancel);

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const STUB_ORDER_ENVIADO: OrderEnviado = {
  id: "order-1",
  clientId: "client-1",
  storeId: "store-1",
  sentAt: new Date("2026-01-01T00:00:00Z"),
  status: ORDER_STATUS.ENVIADO,
};

const STUB_SESSION_CLIENT = {
  user: { id: "client-1", email: "client@test.com", role: "client" as const },
  accessToken: "token",
  refreshToken: "refresh",
  expiresAt: 9999999999,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useCancelOrderMutation", () => {
  it("throws when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useCancelOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate("order-1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("throws when role is store", async () => {
    mockGetSession.mockResolvedValueOnce({
      ...STUB_SESSION_CLIENT,
      user: { ...STUB_SESSION_CLIENT.user, role: "store" as const },
    });

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useCancelOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate("order-1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("calls ordersService.cancel with orderId when authenticated as client", async () => {
    mockGetSession.mockResolvedValueOnce(STUB_SESSION_CLIENT);
    const cancelled = {
      ...STUB_ORDER_ENVIADO,
      status: ORDER_STATUS.CANCELADO,
      cancelledAt: new Date(),
    };
    mockCancel.mockResolvedValueOnce(cancelled as never);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useCancelOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate("order-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCancel).toHaveBeenCalledWith("order-1");
  });

  it("applies optimistic CANCELADO status before the request resolves", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_CLIENT);
    let resolveCancel!: (value: unknown) => void;
    mockCancel.mockReturnValueOnce(
      new Promise((res) => {
        resolveCancel = res;
      }) as never,
    );

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    qc.setQueryData(queryKeys.orders.byId("order-1"), STUB_ORDER_ENVIADO);

    renderHook(() => useCancelOrderMutation(), { wrapper: makeWrapper(qc) });

    act(() => {
      qc.getMutationCache().getAll()[0]?.execute("order-1");
    });

    await waitFor(() => {
      const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId("order-1"));
      return cached?.status === ORDER_STATUS.CANCELADO;
    });

    resolveCancel({
      ...STUB_ORDER_ENVIADO,
      status: ORDER_STATUS.CANCELADO,
      cancelledAt: new Date(),
    });
  });

  it("rolls back optimistic update on error", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_CLIENT);
    mockCancel.mockRejectedValueOnce(new Error("network error"));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(queryKeys.orders.byId("order-1"), STUB_ORDER_ENVIADO);

    const { result } = renderHook(() => useCancelOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate("order-1");
    });

    await waitFor(
      () => {
        const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId("order-1"));
        expect(cached?.status).toBe(ORDER_STATUS.ENVIADO);
      },
      { timeout: 3000 },
    );
  });
});
