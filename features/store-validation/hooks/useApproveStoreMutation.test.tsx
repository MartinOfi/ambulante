import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { useApproveStoreMutation } from "./useApproveStoreMutation";

vi.mock("@/features/store-validation/server-actions/store-validation-actions", () => ({
  approveStoreAction: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { approveStoreAction } from "@/features/store-validation/server-actions/store-validation-actions";

function buildWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useApproveStoreMutation", () => {
  beforeEach(() => {
    vi.mocked(approveStoreAction).mockResolvedValue({ ok: true });
  });

  it("calls approveStoreAction with the store id", async () => {
    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("store-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(approveStoreAction).toHaveBeenCalledWith("store-1");
  });

  it("sets error state when the action returns ok:false", async () => {
    vi.mocked(approveStoreAction).mockResolvedValue({
      ok: false,
      error: "Tienda no encontrada",
    });

    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("non-existent");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("sets error state when the action throws", async () => {
    vi.mocked(approveStoreAction).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("store-1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
