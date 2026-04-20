import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import { StoreDetailPanelContainer } from "./StoreDetailPanel.container";

vi.mock("@/features/store-validation/hooks/useStoreValidationQueueQuery", () => ({
  useStoreValidationQueueQuery: vi.fn(),
}));

vi.mock("@/features/store-validation/hooks/useApproveStoreMutation", () => ({
  useApproveStoreMutation: vi.fn(),
}));

vi.mock("@/features/store-validation/hooks/useRejectStoreMutation", () => ({
  useRejectStoreMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { useApproveStoreMutation } from "@/features/store-validation/hooks/useApproveStoreMutation";
import { useRejectStoreMutation } from "@/features/store-validation/hooks/useRejectStoreMutation";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

const mockUseStoreValidationQueueQuery = vi.mocked(useStoreValidationQueueQuery);
const mockUseApproveStoreMutation = vi.mocked(useApproveStoreMutation);
const mockUseRejectStoreMutation = vi.mocked(useRejectStoreMutation);
const mockUseRouter = vi.mocked(useRouter);

const PENDING_STORE: PendingStore = {
  id: "store-1",
  name: "Taco Loco",
  kind: "food-truck",
  photoUrl: "https://example.com/photo.jpg",
  location: { lat: -34.6, lng: -58.38 },
  distanceMeters: 300,
  status: "open",
  priceFromArs: 1500,
  tagline: "Los mejores tacos",
  ownerId: "owner-1",
  validationStatus: "pending",
};

function buildMutationMock(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useApproveStoreMutation>;
}

describe("StoreDetailPanelContainer", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseApproveStoreMutation.mockReturnValue(buildMutationMock());
    mockUseRejectStoreMutation.mockReturnValue(
      buildMutationMock() as unknown as ReturnType<typeof useRejectStoreMutation>,
    );
  });

  it("renders not-found message when storeId is not in the queue", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreDetailPanelContainer storeId="non-existent" />);

    expect(screen.getByTestId("store-not-found")).toBeInTheDocument();
  });

  it("renders the store detail when the storeId is found", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreDetailPanelContainer storeId="store-1" />);

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
  });

  it("passes isApproving=true to the panel when approve mutation is pending", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    mockUseApproveStoreMutation.mockReturnValue(buildMutationMock({ isPending: true }));

    renderWithProviders(<StoreDetailPanelContainer storeId="store-1" />);

    expect(screen.getByRole("button", { name: /aprobar/i })).toBeDisabled();
  });

  it("calls approve mutation and navigates to stores list on success", async () => {
    const approveMutate = vi.fn();
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    mockUseApproveStoreMutation.mockReturnValue(buildMutationMock({ mutate: approveMutate }));

    renderWithProviders(<StoreDetailPanelContainer storeId="store-1" />);

    screen.getByRole("button", { name: /aprobar/i }).click();

    expect(approveMutate).toHaveBeenCalledWith(
      "store-1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    // Simulate the onSuccess callback being invoked
    const { onSuccess } = approveMutate.mock.calls[0][1] as { onSuccess: () => void };
    onSuccess();

    expect(mockPush).toHaveBeenCalledWith(ROUTES.admin.stores);
  });
});
