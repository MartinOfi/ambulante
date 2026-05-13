import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithProviders } from "@/shared/test-utils/render";
import { StoreValidationQueueContainer } from "./StoreValidationQueue.container";

vi.mock("@/features/store-validation/hooks/useStoresByStatusQuery", () => ({
  useStoresByStatusQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/stores",
}));

import { useStoresByStatusQuery } from "@/features/store-validation/hooks/useStoresByStatusQuery";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

const mockUseStoresByStatusQuery = vi.mocked(useStoresByStatusQuery);

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
    mockUseStoresByStatusQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoresByStatusQuery>);

    renderWithProviders(<StoreValidationQueueContainer />);

    expect(screen.getByTestId("queue-loading")).toBeInTheDocument();
  });

  it("renders stores when query succeeds", () => {
    mockUseStoresByStatusQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoresByStatusQuery>);

    renderWithProviders(<StoreValidationQueueContainer />);

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
  });

  it("renders empty state when query returns empty array", () => {
    mockUseStoresByStatusQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoresByStatusQuery>);

    renderWithProviders(<StoreValidationQueueContainer />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
  });

  it("renders a Ver detalle link for each store", () => {
    mockUseStoresByStatusQuery.mockReturnValue({
      data: [PENDING_STORE],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoresByStatusQuery>);

    renderWithProviders(<StoreValidationQueueContainer />);

    expect(screen.getByRole("link", { name: /ver detalle/i })).toBeInTheDocument();
  });

  it("renders all three status tabs", () => {
    mockUseStoresByStatusQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useStoresByStatusQuery>);

    renderWithProviders(<StoreValidationQueueContainer />);

    expect(screen.getByRole("tab", { name: /pendientes/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /aprobadas/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /rechazadas/i })).toBeInTheDocument();
  });
});
