import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { useRejectStoreMutation } from "./useRejectStoreMutation";
import type { RejectStoreInput } from "@/features/store-validation/types/store-validation.types";

vi.mock("@/features/store-validation/server-actions/store-validation-actions", () => ({
  rejectStoreAction: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { rejectStoreAction } from "@/features/store-validation/server-actions/store-validation-actions";

function buildWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useRejectStoreMutation", () => {
  beforeEach(() => {
    vi.mocked(rejectStoreAction).mockResolvedValue({ ok: true });
  });

  it("calls rejectStoreAction with storeId and reason", async () => {
    const input: RejectStoreInput = { storeId: "store-1", reason: "Documentación incompleta" };

    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rejectStoreAction).toHaveBeenCalledWith(input);
  });

  it("sets error state when the action returns ok:false", async () => {
    vi.mocked(rejectStoreAction).mockResolvedValue({
      ok: false,
      error: "Motivo demasiado corto",
    });

    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", reason: "Documentación incompleta" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("sets error state when the action throws", async () => {
    vi.mocked(rejectStoreAction).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate({ storeId: "non-existent", reason: "Motivo cualquiera" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
