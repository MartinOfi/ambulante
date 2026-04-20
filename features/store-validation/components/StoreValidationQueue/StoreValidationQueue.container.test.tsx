import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import { StoreValidationQueueContainer } from "./StoreValidationQueue.container";

vi.mock("@/features/store-validation/hooks/useStoreValidationQueueQuery", () => ({
  useStoreValidationQueueQuery: vi.fn(),
}));

import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

const mockUseStoreValidationQueueQuery = vi.mocked(useStoreValidationQueueQuery);

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

describe("StoreValidationQueueContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while query is loading", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreValidationQueueContainer onSelectStore={vi.fn()} />);

    expect(screen.getByTestId("queue-loading")).toBeInTheDocument();
  });

  it("renders the list of stores when query succeeds", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreValidationQueueContainer onSelectStore={vi.fn()} />);

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
  });

  it("renders empty state when query returns empty array", () => {
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreValidationQueueContainer onSelectStore={vi.fn()} />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
  });

  it("propagates onSelectStore callback to the dumb component", () => {
    const onSelectStore = vi.fn();
    mockUseStoreValidationQueueQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoreValidationQueueQuery>);

    renderWithProviders(<StoreValidationQueueContainer onSelectStore={onSelectStore} />);

    screen.getByRole("button", { name: /taco loco/i }).click();

    expect(onSelectStore).toHaveBeenCalledWith("store-1");
  });
});
