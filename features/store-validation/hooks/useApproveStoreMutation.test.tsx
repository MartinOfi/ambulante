import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import { useApproveStoreMutation } from "./useApproveStoreMutation";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";

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

const APPROVED_STORE = {
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
  validationStatus: "approved" as const,
};

function buildWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useApproveStoreMutation", () => {
  beforeEach(() => {
    vi.mocked(storeValidationService.approveStore).mockResolvedValue(APPROVED_STORE);
  });

  it("calls approveStore with the store id", async () => {
    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("store-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(storeValidationService.approveStore).toHaveBeenCalledWith("store-1");
  });

  it("returns the approved store on success", async () => {
    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("store-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.validationStatus).toBe(STORE_VALIDATION_STATUS.approved);
  });

  it("sets error state when approveStore throws", async () => {
    vi.mocked(storeValidationService.approveStore).mockRejectedValue(
      new Error("Tienda no encontrada"),
    );

    const { result } = renderHook(() => useApproveStoreMutation(), {
      wrapper: buildWrapper(),
    });

    await act(async () => {
      result.current.mutate("non-existent");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
