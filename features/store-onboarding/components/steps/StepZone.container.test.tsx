import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StepZone } from "./StepZone.container";

describe("StepZone", () => {
  it("renders all fields", () => {
    render(<StepZone onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByLabelText(/barrio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notas de cobertura/i)).toBeInTheDocument();
  });

  it("calls onNext with valid values on submit", async () => {
    const onNext = vi.fn();
    render(<StepZone onNext={onNext} onBack={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/barrio/i), {
      target: { value: "Palermo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith({
        neighborhood: "Palermo",
        coverageNotes: "",
      });
    });
  });

  it("shows validation error for empty neighborhood", async () => {
    render(<StepZone onNext={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/barrio no puede estar vacío/i)).toBeInTheDocument();
    });
  });

  it("calls onBack when Atrás is clicked", () => {
    const onBack = vi.fn();
    render(<StepZone onNext={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /atrás/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("coverageNotes is optional — submits without it", async () => {
    const onNext = vi.fn();
    render(<StepZone onNext={onNext} onBack={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/barrio/i), {
      target: { value: "San Telmo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ neighborhood: "San Telmo" }));
    });
  });
});
