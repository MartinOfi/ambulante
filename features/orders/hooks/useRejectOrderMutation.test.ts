import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { useRejectOrderMutation } from "./useRejectOrderMutation";
import { authService } from "@/shared/services/auth";
import { rejectOrder } from "@/features/orders/actions";
import { ORDER_STATUS } from "@/shared/constants/order";
import { queryKeys } from "@/shared/query/keys";
import type { Order } from "@/shared/schemas/order";

vi.mock("@/shared/services/auth", () => ({
  authService: { getSession: vi.fn() },
}));

vi.mock("@/features/orders/actions", () => ({
  rejectOrder: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const mockGetSession = vi.mocked(authService.getSession);
const mockRejectOrder = vi.mocked(rejectOrder);

const ORDER_PUBLIC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const STUB_ORDER_RECIBIDO: Order = {
  id: ORDER_PUBLIC_ID,
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.RECIBIDO,
  items: [{ productId: "p1", productName: "Empanada", productPriceArs: 500, quantity: 1 }],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const STUB_SESSION_STORE = {
  user: { id: "store-1", email: "store@test.com", role: "store" as const },
  accessToken: "token",
  refreshToken: "refresh",
  expiresAt: 9999999999,
};

const SUCCESS_RESULT = {
  ok: true,
  publicId: ORDER_PUBLIC_ID,
  status: ORDER_STATUS.RECHAZADO,
} as const;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useRejectOrderMutation", () => {
  it("throws when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useRejectOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockRejectOrder).not.toHaveBeenCalled();
  });

  it("throws when role is client", async () => {
    mockGetSession.mockResolvedValueOnce({
      ...STUB_SESSION_STORE,
      user: { ...STUB_SESSION_STORE.user, role: "client" as const },
    });

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useRejectOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockRejectOrder).not.toHaveBeenCalled();
  });

  it("calls rejectOrder Server Action when authenticated as store", async () => {
    mockGetSession.mockResolvedValueOnce(STUB_SESSION_STORE);
    mockRejectOrder.mockResolvedValueOnce(SUCCESS_RESULT);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useRejectOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRejectOrder).toHaveBeenCalledWith({ publicId: ORDER_PUBLIC_ID });
    expect(result.current.data).toEqual({
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.RECHAZADO,
    });
  });

  it("throws and surfaces message when rejectOrder returns ok:false", async () => {
    mockGetSession.mockResolvedValueOnce(STUB_SESSION_STORE);
    mockRejectOrder.mockResolvedValueOnce({
      ok: false,
      errorCode: "INVALID_TRANSITION",
      message: "Solo podés rechazar pedidos en estado Recibido.",
    });

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useRejectOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const error = result.current.error;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/Recibido/i);
  });

  it("applies optimistic RECHAZADO status before the request resolves", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_STORE);
    let resolveReject!: (value: typeof SUCCESS_RESULT) => void;
    mockRejectOrder.mockReturnValueOnce(
      new Promise<typeof SUCCESS_RESULT>((res) => {
        resolveReject = res;
      }),
    );

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    qc.setQueryData(queryKeys.orders.byId(ORDER_PUBLIC_ID), STUB_ORDER_RECIBIDO);

    renderHook(() => useRejectOrderMutation(), { wrapper: makeWrapper(qc) });

    act(() => {
      qc.getMutationCache().getAll()[0]?.execute({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => {
      const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId(ORDER_PUBLIC_ID));
      return cached?.status === ORDER_STATUS.RECHAZADO;
    });

    await act(async () => {
      resolveReject(SUCCESS_RESULT);
    });
  });

  it("rolls back optimistic update on error", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_STORE);
    mockRejectOrder.mockRejectedValueOnce(new Error("network error"));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(queryKeys.orders.byId(ORDER_PUBLIC_ID), STUB_ORDER_RECIBIDO);

    const { result } = renderHook(() => useRejectOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(
      () => {
        const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId(ORDER_PUBLIC_ID));
        expect(cached?.status).toBe(ORDER_STATUS.RECIBIDO);
      },
      { timeout: 3000 },
    );
  });
});
