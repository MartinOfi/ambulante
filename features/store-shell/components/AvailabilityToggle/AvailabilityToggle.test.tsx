import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AvailabilityToggle } from "./AvailabilityToggle";

describe("AvailabilityToggle", () => {
  it("renders 'No disponible' label when unavailable", () => {
    render(<AvailabilityToggle isAvailable={false} onToggle={vi.fn()} />);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("renders 'Disponible' label when available", () => {
    render(<AvailabilityToggle isAvailable={true} onToggle={vi.fn()} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("calls onToggle when the toggle button is clicked", async () => {
    const onToggle = vi.fn();
    render(<AvailabilityToggle isAvailable={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("switch is unchecked when unavailable", () => {
    render(<AvailabilityToggle isAvailable={false} onToggle={vi.fn()} />);
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("switch is checked when available", () => {
    render(<AvailabilityToggle isAvailable={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeChecked();
  });
});
