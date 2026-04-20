import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import { useRejectStoreMutation } from "./useRejectStoreMutation";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import type { RejectStoreInput } from "@/features/store-validation/types/store-validation.types";

vi.mock("@/features/store-validation/services/store-validation.service.mock", () => ({
  storeValidationService: {
    getPendingStores: vi.fn(),
    getStoreById: vi.fn(),
    approveStore: vi.fn(),
    rejectStore: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const REJECTED_STORE = {
  id: "store-1",
  name: "Test Store",
  kind: "food-truck" as const,
  photoUrl: "https://example.com/photo.jpg",
  location: { lat: -34.6, lng: -58.38 },
  distanceMeters: 500,
  status: "open" as const,
  priceFromArs: 1000,
  tagline: "Test tagline",
  ownerId: "11111111-1111-1111-1111-111111111111",
  validationStatus: "rejected" as const,
  rejectionReason: "Documentación incompleta",
};

function buildWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useRejectStoreMutation", () => {
  beforeEach(() => {
    vi.mocked(storeValidationService.rejectStore).mockResolvedValue(REJECTED_STORE);
  });

  it("calls rejectStore with storeId and reason", async () => {
    const input: RejectStoreInput = { storeId: "store-1", reason: "Documentación incompleta" };

    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate(input);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(storeValidationService.rejectStore).toHaveBeenCalledWith(input);
  });

  it("returns the rejected store with rejection reason", async () => {
    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate({ storeId: "store-1", reason: "Documentación incompleta" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.validationStatus).toBe(STORE_VALIDATION_STATUS.rejected);
    expect(result.current.data?.rejectionReason).toBe("Documentación incompleta");
  });

  it("sets error state when rejectStore throws", async () => {
    vi.mocked(storeValidationService.rejectStore).mockRejectedValue(
      new Error("Tienda no encontrada"),
    );

    const { result } = renderHook(() => useRejectStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate({ storeId: "non-existent", reason: "Motivo cualquiera" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
