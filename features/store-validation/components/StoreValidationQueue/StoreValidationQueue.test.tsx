import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StoreValidationQueue } from "./StoreValidationQueue";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

const PENDING_STORE_1: PendingStore = {
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

const PENDING_STORE_2: PendingStore = {
  id: "store-2",
  name: "Empanadas Del Sur",
  kind: "food-truck",
  photoUrl: "https://example.com/photo2.jpg",
  location: { lat: -34.61, lng: -58.39 },
  distanceMeters: 500,
  status: "open",
  priceFromArs: 800,
  tagline: "Las mejores empanadas",
  ownerId: "owner-2",
  validationStatus: "pending",
};

describe("StoreValidationQueue", () => {
  it("renders a list of pending stores", () => {
    render(
      <StoreValidationQueue
        stores={[PENDING_STORE_1, PENDING_STORE_2]}
        isLoading={false}
        onSelectStore={vi.fn()}
      />,
    );

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
    expect(screen.getByText("Empanadas Del Sur")).toBeInTheDocument();
  });

  it("shows a loading skeleton when isLoading is true", () => {
    render(<StoreValidationQueue stores={[]} isLoading={true} onSelectStore={vi.fn()} />);

    expect(screen.getByTestId("queue-loading")).toBeInTheDocument();
    expect(screen.queryByText("Taco Loco")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when there are no stores", () => {
    render(<StoreValidationQueue stores={[]} isLoading={false} onSelectStore={vi.fn()} />);

    expect(screen.getByTestId("queue-empty")).toBeInTheDocument();
  });

  it("calls onSelectStore with the store id when a store row is clicked", () => {
    const onSelectStore = vi.fn();

    render(
      <StoreValidationQueue
        stores={[PENDING_STORE_1]}
        isLoading={false}
        onSelectStore={onSelectStore}
      />,
    );

    screen.getByRole("button", { name: /taco loco/i }).click();

    expect(onSelectStore).toHaveBeenCalledWith("store-1");
  });

  it("displays the store tagline below the name", () => {
    render(
      <StoreValidationQueue stores={[PENDING_STORE_1]} isLoading={false} onSelectStore={vi.fn()} />,
    );

    expect(screen.getByText("Los mejores tacos")).toBeInTheDocument();
  });
});
