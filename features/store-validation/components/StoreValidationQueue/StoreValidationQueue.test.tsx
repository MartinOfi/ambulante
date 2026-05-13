import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";
import { StoreValidationQueue } from "./StoreValidationQueue";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/stores",
}));

const STORE_1: PendingStore = {
  id: "store-1",
  name: "Taco Loco",
  kind: "food-truck",
  photoUrl: "https://example.com/photo1.jpg",
  location: { lat: -34.6, lng: -58.38 },
  distanceMeters: 300,
  status: "open",
  priceFromArs: 1500,
  tagline: "Los mejores tacos",
  ownerId: "owner-1",
  validationStatus: "pending",
};

const STORE_2: PendingStore = {
  id: "store-2",
  name: "Empanadas Del Sur",
  kind: "street-cart",
  photoUrl: "https://example.com/photo2.jpg",
  location: { lat: -34.61, lng: -58.39 },
  distanceMeters: 500,
  status: "open",
  priceFromArs: 800,
  tagline: "Las mejores empanadas",
  ownerId: "owner-2",
  validationStatus: "pending",
};

const DEFAULT_PROPS = {
  stores: [STORE_1, STORE_2],
  isLoading: false,
  activeStatus: STORE_VALIDATION_STATUS.pending,
  searchQuery: "",
  onStatusChange: vi.fn(),
  onSearchChange: vi.fn(),
} as const;

describe("StoreValidationQueue", () => {
  it("renders a tab for each validation status", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} />);

    expect(screen.getByRole("tab", { name: /pendientes/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /aprobadas/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /rechazadas/i })).toBeInTheDocument();
  });

  it("marks the active tab as selected", () => {
    render(
      <StoreValidationQueue {...DEFAULT_PROPS} activeStatus={STORE_VALIDATION_STATUS.approved} />,
    );

    expect(screen.getByRole("tab", { name: /aprobadas/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /pendientes/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("renders the search input", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} />);

    expect(screen.getByRole("searchbox", { name: /buscar tienda/i })).toBeInTheDocument();
  });

  it("renders a table row per store with a Ver detalle link", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} />);

    const links = screen.getAllByRole("link", { name: /ver detalle/i });
    expect(links).toHaveLength(2);

    const rows = screen.getAllByRole("row");
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it("shows loading state when isLoading is true", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} stores={[]} isLoading={true} />);

    expect(screen.getByTestId("queue-loading")).toBeInTheDocument();
  });

  it("shows empty state when there are no stores", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} stores={[]} />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
  });

  it("calls onStatusChange with the correct status when a tab is clicked", async () => {
    const onStatusChange = vi.fn();
    render(<StoreValidationQueue {...DEFAULT_PROPS} onStatusChange={onStatusChange} />);

    await userEvent.click(screen.getByRole("tab", { name: /aprobadas/i }));

    expect(onStatusChange).toHaveBeenCalledWith(STORE_VALIDATION_STATUS.approved);
  });

  it("filters rows client-side by searchQuery", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} searchQuery="Taco" />);

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
    expect(screen.queryByText("Empanadas Del Sur")).not.toBeInTheDocument();
  });

  it("shows the store name and kind in each row", () => {
    render(<StoreValidationQueue {...DEFAULT_PROPS} stores={[STORE_1]} />);

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
    expect(screen.getByText("food-truck")).toBeInTheDocument();
  });
});
