import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/shared/test-utils";
import { AvailabilityToggle } from "./AvailabilityToggle";

describe("AvailabilityToggle", () => {
  it("renders 'No disponible' label when unavailable", () => {
    renderWithProviders(<AvailabilityToggle isAvailable={false} onToggle={vi.fn()} />);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("renders 'Disponible' label when available", () => {
    renderWithProviders(<AvailabilityToggle isAvailable={true} onToggle={vi.fn()} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("calls onToggle when the toggle button is clicked", async () => {
    const onToggle = vi.fn();
    renderWithProviders(<AvailabilityToggle isAvailable={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("switch is unchecked when unavailable", () => {
    renderWithProviders(<AvailabilityToggle isAvailable={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("switch is checked when available", () => {
    renderWithProviders(<AvailabilityToggle isAvailable={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("shows 'GPS activo' label when locationStatus is publishing", () => {
    render(
      <AvailabilityToggle isAvailable={true} locationStatus="publishing" onToggle={vi.fn()} />,
    );
    expect(screen.getByText("GPS activo")).toBeInTheDocument();
  });

  it("shows 'GPS desactualizado' label when locationStatus is stale", () => {
    render(<AvailabilityToggle isAvailable={true} locationStatus="stale" onToggle={vi.fn()} />);
    expect(screen.getByText("GPS desactualizado")).toBeInTheDocument();
  });

  it("shows 'Error de GPS' label when locationStatus is error", () => {
    render(<AvailabilityToggle isAvailable={true} locationStatus="error" onToggle={vi.fn()} />);
    expect(screen.getByText("Error de GPS")).toBeInTheDocument();
  });

  it("shows no location label when locationStatus is idle", () => {
    render(<AvailabilityToggle isAvailable={true} locationStatus="idle" onToggle={vi.fn()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/GPS/)).not.toBeInTheDocument();
  });
});
