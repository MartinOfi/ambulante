import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StoreDetailPanel } from "./StoreDetailPanel";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

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

describe("StoreDetailPanel", () => {
  it("renders the store name and tagline", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Taco Loco")).toBeInTheDocument();
    expect(screen.getByText("Los mejores tacos")).toBeInTheDocument();
  });

  it("renders the approve and reject buttons", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /aprobar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rechazar/i })).toBeInTheDocument();
  });

  it("calls onApprove when the approve button is clicked", () => {
    const onApprove = vi.fn();

    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /aprobar/i }));

    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("calls onReject when the reject button is clicked", () => {
    const onReject = vi.fn();

    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /rechazar/i }));

    expect(onReject).toHaveBeenCalledOnce();
  });

  it("disables the approve button when isApproving is true", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={true}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /aprobar/i })).toBeDisabled();
  });

  it("disables the reject button when isRejecting is true", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={true}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /rechazar/i })).toBeDisabled();
  });

  it("renders the store photo", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const img = screen.getByRole("img", { name: /taco loco/i });
    expect(img).toBeInTheDocument();
  });

  it("does not render tagline element when tagline is absent", () => {
    const { tagline: _tagline, ...withoutTagline } = PENDING_STORE;
    render(
      <StoreDetailPanel
        store={withoutTagline}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.queryByText("Los mejores tacos")).not.toBeInTheDocument();
  });

  it("uses placeholder image when photoUrl is absent", () => {
    const { photoUrl: _photo, ...withoutPhoto } = PENDING_STORE;
    render(
      <StoreDetailPanel
        store={withoutPhoto}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const img = screen.getByRole("img", { name: /taco loco/i });
    expect(img).toHaveAttribute("src", expect.stringContaining("placeholder"));
  });

  it("does not render the validation docs section when slot is not provided", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("validation-docs-section")).not.toBeInTheDocument();
  });

  it("renders the validation docs section when slot is provided", () => {
    render(
      <StoreDetailPanel
        store={PENDING_STORE}
        isApproving={false}
        isRejecting={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        validationDocsSlot={<div data-testid="docs-stub">docs</div>}
      />,
    );

    expect(screen.getByTestId("validation-docs-section")).toBeInTheDocument();
    expect(screen.getByTestId("docs-stub")).toBeInTheDocument();
  });
});
