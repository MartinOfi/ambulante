import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/shared/test-utils";
import { ServiceWorkerUpdateBanner } from "./ServiceWorkerUpdateBanner";

describe("ServiceWorkerUpdateBanner", () => {
  it("renders the update message in Spanish", () => {
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText(/nueva versión disponible/i)).toBeInTheDocument();
  });

  it("renders the 'Actualizar' button", () => {
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: /actualizar/i })).toBeInTheDocument();
  });

  it("renders the 'Después' button", () => {
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: /después/i })).toBeInTheDocument();
  });

  it("calls onApply when 'Actualizar' is clicked", async () => {
    const onApply = vi.fn();
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={onApply} onDismiss={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /actualizar/i }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when 'Después' is clicked", async () => {
    const onDismiss = vi.fn();
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("button", { name: /después/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("has role='alert' for screen readers (a11y)", () => {
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("has aria-live='polite' to not interrupt screen readers", () => {
    renderWithProviders(<ServiceWorkerUpdateBanner onApply={vi.fn()} onDismiss={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });
});
