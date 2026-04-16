import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StepHours } from "./StepHours.container";

describe("StepHours", () => {
  it("renders day toggles and time inputs", () => {
    render(<StepHours onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("button", { name: /lun/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/apertura/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cierre/i)).toBeInTheDocument();
  });

  it("calls onNext with valid values after selecting a day", async () => {
    const onNext = vi.fn();
    render(<StepHours onNext={onNext} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledWith(
        expect.objectContaining({ days: ["lunes"], openTime: "09:00", closeTime: "18:00" }),
      );
    });
  });

  it("shows error when no day is selected", async () => {
    render(<StepHours onNext={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos un día/i)).toBeInTheDocument();
    });
  });

  it("toggles a day off when clicked twice", async () => {
    const onNext = vi.fn();
    render(<StepHours onNext={onNext} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos un día/i)).toBeInTheDocument();
    });
    expect(onNext).not.toHaveBeenCalled();
  });

  it("calls onBack when Atrás is clicked", () => {
    const onBack = vi.fn();
    render(<StepHours onNext={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /atrás/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("disables buttons when isLoading is true", () => {
    render(<StepHours onNext={vi.fn()} onBack={vi.fn()} isLoading />);
    expect(screen.getByRole("button", { name: /enviando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /atrás/i })).toBeDisabled();
  });
});
