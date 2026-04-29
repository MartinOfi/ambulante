import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { logger } from "@/shared/utils/logger";
import { queryKeys } from "@/shared/query/keys";
import { ORDER_STATUS } from "@/shared/constants/order";
import { submitOrder, type SubmitOrderInput } from "@/features/order-flow";
import { useSendOrderMutation } from "./useSendOrderMutation";

vi.mock("@/features/order-flow", () => ({
  submitOrder: vi.fn(),
}));

const submitOrderMock = vi.mocked(submitOrder);

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const VALID_INPUT: SubmitOrderInput = {
  storeId: "11111111-1111-4111-8111-111111111111",
  items: [{ productId: "22222222-2222-4222-8222-222222222222", quantity: 2 }],
};

const SUCCESS_RESULT = {
  ok: true,
  publicId: "33333333-3333-4333-8333-333333333333",
  status: ORDER_STATUS.ENVIADO,
} as const;

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
    submitOrderMock.mockReset();
    vi.clearAllMocks();
  });

  it("calls submitOrder with the given input", async () => {
    submitOrderMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(submitOrderMock).toHaveBeenCalledWith(VALID_INPUT);
  });

  it("returns publicId + status on success", async () => {
    submitOrderMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      publicId: SUCCESS_RESULT.publicId,
      status: ORDER_STATUS.ENVIADO,
    });
  });

  it("invalidates orders.all() after success", async () => {
    submitOrderMock.mockResolvedValueOnce(SUCCESS_RESULT);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orders.all() });
  });

  it("throws and logs when submitOrder returns ok:false", async () => {
    submitOrderMock.mockResolvedValueOnce({
      ok: false,
      errorCode: "PRODUCT_UNAVAILABLE",
      message: "Algún producto del pedido ya no está disponible.",
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logger.error).toHaveBeenCalledWith(
      "useSendOrderMutation: send failed",
      expect.objectContaining({ error: expect.stringMatching(/producto/i) }),
    );
  });

  it("sets isError and logs on rejected promise", async () => {
    submitOrderMock.mockRejectedValueOnce(new Error("Network error"));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendOrderMutation(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logger.error).toHaveBeenCalledWith(
      "useSendOrderMutation: send failed",
      expect.objectContaining({ error: "Network error" }),
    );
  });
});
