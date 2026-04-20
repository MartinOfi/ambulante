import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { NearbyBottomSheet } from "./NearbyBottomSheet";
import type { Store } from "@/shared/types/store";

const MOCK_STORES: readonly Store[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Empanadas Don Pedro",
    kind: "food-truck",
    status: "open",
    photoUrl: "https://example.com/store1.jpg",
    location: { lat: -34.604, lng: -58.382 },
    distanceMeters: 500,
    priceFromArs: 1200,
    tagline: "Las mejores empanadas del barrio",
    ownerId: "00000000-0000-4000-8000-000000000001",
  },
];

describe("NearbyBottomSheet", () => {
  it("renders the section with correct aria-label", () => {
    render(
      <NearbyBottomSheet
        stores={MOCK_STORES}
        radius={1000}
        onExpandRadius={vi.fn()}
        onSelectStore={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Tiendas cercanas" })).toBeInTheDocument();
  });

  it("renders store cards for each store", () => {
    render(
      <NearbyBottomSheet
        stores={MOCK_STORES}
        radius={1000}
        onExpandRadius={vi.fn()}
        onSelectStore={vi.fn()}
      />,
    );

    expect(screen.getByText("Empanadas Don Pedro")).toBeInTheDocument();
  });

  it("renders empty state when no stores", () => {
    render(
      <NearbyBottomSheet
        stores={[]}
        radius={1000}
        onExpandRadius={vi.fn()}
        onSelectStore={vi.fn()}
      />,
    );

    expect(screen.queryByText("Empanadas Don Pedro")).not.toBeInTheDocument();
  });

  it("handle button has aria-expanded attribute reflecting snap state", () => {
    render(
      <NearbyBottomSheet
        stores={MOCK_STORES}
        radius={1000}
        onExpandRadius={vi.fn()}
        onSelectStore={vi.fn()}
      />,
    );

    const handleButton = screen.getByRole("button", { name: /hoja/i });
    expect(handleButton).toHaveAttribute("aria-expanded");
  });

  it("handle button aria-expanded is false when sheet is collapsed", () => {
    render(
      <NearbyBottomSheet
        stores={MOCK_STORES}
        radius={1000}
        onExpandRadius={vi.fn()}
        onSelectStore={vi.fn()}
      />,
    );

    const handleButton = screen.getByRole("button", { name: /hoja/i });

    // Default snap is HALF → expanded=true. Click twice to reach COLLAPSED.
    fireEvent.click(handleButton); // HALF → FULL
    fireEvent.click(handleButton); // FULL → COLLAPSED

    expect(handleButton).toHaveAttribute("aria-expanded", "false");
  });
});
