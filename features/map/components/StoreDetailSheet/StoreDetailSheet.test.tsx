import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import type { Store } from "@/shared/types/store";
import type { Product } from "@/shared/schemas/product";
import { StoreDetailSheet } from "./StoreDetailSheet";

const MOCK_STORE: Store = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Empanadas Don Pedro",
  kind: "food-truck",
  status: "open",
  photoUrl: "https://example.com/store1.jpg",
  location: { lat: -34.604, lng: -58.382 },
  distanceMeters: 500,
  priceFromArs: 1200,
  tagline: "Las mejores empanadas del barrio",
  description: "Un food truck con las mejores empanadas del barrio porteño.",
  hours: "Lun–Sáb 12:00–22:00",
  ownerId: "00000000-0000-4000-8000-000000000001",
};

const MOCK_PRODUCTS: readonly Product[] = [
  {
    id: "prod-1",
    storeId: "store-1",
    name: "Empanada de carne",
    description: "Cortada a cuchillo, jugosa",
    priceArs: 600,
    isAvailable: true,
  },
  {
    id: "prod-2",
    storeId: "store-1",
    name: "Empanada de jamón y queso",
    priceArs: 550,
    isAvailable: false,
  },
];

describe("StoreDetailSheet", () => {
  it("renders store name and tagline", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={[]}
        isLoadingProducts={false}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Empanadas Don Pedro" })).toBeInTheDocument();
    expect(screen.getByText("Las mejores empanadas del barrio")).toBeInTheDocument();
  });

  it("renders store photo with alt text", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={[]}
        isLoadingProducts={false}
        onDismiss={vi.fn()}
      />,
    );

    const img = screen.getByRole("img", { name: "Empanadas Don Pedro" });
    expect(img).toHaveAttribute("src", expect.stringContaining("store1.jpg"));
  });

  it("renders description and hours when present", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={[]}
        isLoadingProducts={false}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Un food truck con las mejores empanadas del barrio porteño."),
    ).toBeInTheDocument();
    expect(screen.getByText("Lun–Sáb 12:00–22:00")).toBeInTheDocument();
  });

  it("renders product list with names and prices", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={MOCK_PRODUCTS}
        isLoadingProducts={false}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Empanada de carne")).toBeInTheDocument();
    expect(screen.getByText("Empanada de jamón y queso")).toBeInTheDocument();
    expect(screen.getByText("$ 600")).toBeInTheDocument();
    expect(screen.getByText("$ 550")).toBeInTheDocument();
  });

  it("shows loading state while products are loading", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={[]}
        isLoadingProducts={true}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("marks unavailable products visually", () => {
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={MOCK_PRODUCTS}
        isLoadingProducts={false}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Sin stock")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is pressed", () => {
    const onDismiss = vi.fn();
    render(
      <StoreDetailSheet
        store={MOCK_STORE}
        products={[]}
        isLoadingProducts={false}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
