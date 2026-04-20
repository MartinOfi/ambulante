import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createTestQueryClient } from "@/shared/test-utils/render";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import { useStoreValidationQueueQuery } from "./useStoreValidationQueueQuery";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";

vi.mock("@/features/store-validation/services/store-validation.service.mock", () => ({
  storeValidationService: {
    getPendingStores: vi.fn(),
    getStoreById: vi.fn(),
    approveStore: vi.fn(),
    rejectStore: vi.fn(),
  },
}));

const PENDING_STORE = {
  id: "store-pending-1",
  name: "Tienda Pendiente",
  kind: "food-truck" as const,
  photoUrl: "https://example.com/photo.jpg",
  location: { lat: -34.6, lng: -58.38 },
  distanceMeters: 500,
  status: "open" as const,
  priceFromArs: 1000,
  tagline: "Test tagline",
  ownerId: "11111111-1111-1111-1111-111111111111",
  validationStatus: "pending" as const,
};

function buildWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStoreValidationQueueQuery", () => {
  beforeEach(() => {
    vi.mocked(storeValidationService.getPendingStores).mockResolvedValue([PENDING_STORE]);
  });

  it("returns pending stores on success", async () => {
    const { result } = renderHook(() => useStoreValidationQueueQuery(), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.validationStatus).toBe(STORE_VALIDATION_STATUS.pending);
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useStoreValidationQueueQuery(), {
      wrapper: buildWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
