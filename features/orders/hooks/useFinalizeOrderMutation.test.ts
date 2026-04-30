import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { useFinalizeOrderMutation } from "./useFinalizeOrderMutation";
import { authService } from "@/shared/services/auth";
import { finalizeOrder } from "@/features/orders/actions";
import { ORDER_STATUS } from "@/shared/constants/order";
import { queryKeys } from "@/shared/query/keys";
import type { Order } from "@/shared/schemas/order";

vi.mock("@/shared/services/auth", () => ({
  authService: { getSession: vi.fn() },
}));

vi.mock("@/features/orders/actions", () => ({
  finalizeOrder: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const mockGetSession = vi.mocked(authService.getSession);
const mockFinalizeOrder = vi.mocked(finalizeOrder);

const ORDER_PUBLIC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const STUB_ORDER_EN_CAMINO: Order = {
  id: ORDER_PUBLIC_ID,
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.EN_CAMINO,
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
  status: ORDER_STATUS.FINALIZADO,
} as const;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useFinalizeOrderMutation", () => {
  it("throws when session is null", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useFinalizeOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockFinalizeOrder).not.toHaveBeenCalled();
  });

  it("throws when role is client", async () => {
    mockGetSession.mockResolvedValueOnce({
      ...STUB_SESSION_STORE,
      user: { ...STUB_SESSION_STORE.user, role: "client" as const },
    });

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useFinalizeOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockFinalizeOrder).not.toHaveBeenCalled();
  });

  it("calls finalizeOrder Server Action when authenticated as store", async () => {
    mockGetSession.mockResolvedValueOnce(STUB_SESSION_STORE);
    mockFinalizeOrder.mockResolvedValueOnce(SUCCESS_RESULT);

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useFinalizeOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFinalizeOrder).toHaveBeenCalledWith({ publicId: ORDER_PUBLIC_ID });
    expect(result.current.data).toEqual({
      publicId: ORDER_PUBLIC_ID,
      status: ORDER_STATUS.FINALIZADO,
    });
  });

  it("throws and surfaces message when finalizeOrder returns ok:false", async () => {
    mockGetSession.mockResolvedValueOnce(STUB_SESSION_STORE);
    mockFinalizeOrder.mockResolvedValueOnce({
      ok: false,
      errorCode: "INVALID_TRANSITION",
      message: "Solo podés finalizar pedidos en estado En camino.",
    });

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useFinalizeOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const error = result.current.error;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/camino/i);
  });

  it("applies optimistic FINALIZADO status before the request resolves", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_STORE);
    let resolveFinalize!: (value: typeof SUCCESS_RESULT) => void;
    mockFinalizeOrder.mockReturnValueOnce(
      new Promise<typeof SUCCESS_RESULT>((res) => {
        resolveFinalize = res;
      }),
    );

    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    qc.setQueryData(queryKeys.orders.byId(ORDER_PUBLIC_ID), STUB_ORDER_EN_CAMINO);

    renderHook(() => useFinalizeOrderMutation(), { wrapper: makeWrapper(qc) });

    act(() => {
      qc.getMutationCache().getAll()[0]?.execute({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(() => {
      const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId(ORDER_PUBLIC_ID));
      return cached?.status === ORDER_STATUS.FINALIZADO;
    });

    await act(async () => {
      resolveFinalize(SUCCESS_RESULT);
    });
  });

  it("rolls back optimistic update on error", async () => {
    mockGetSession.mockResolvedValue(STUB_SESSION_STORE);
    mockFinalizeOrder.mockRejectedValueOnce(new Error("network error"));

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(queryKeys.orders.byId(ORDER_PUBLIC_ID), STUB_ORDER_EN_CAMINO);

    const { result } = renderHook(() => useFinalizeOrderMutation(), {
      wrapper: makeWrapper(qc),
    });

    await act(async () => {
      result.current.mutate({ publicId: ORDER_PUBLIC_ID });
    });

    await waitFor(
      () => {
        const cached = qc.getQueryData<{ status: string }>(queryKeys.orders.byId(ORDER_PUBLIC_ID));
        expect(cached?.status).toBe(ORDER_STATUS.EN_CAMINO);
      },
      { timeout: 3000 },
    );
  });
});
