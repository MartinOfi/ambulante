import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { DisplayNameField } from "./DisplayNameField";
import { MAX_DISPLAY_NAME_LENGTH } from "@/features/profile/profile.constants";

const baseProps = {
  initialValue: "Juan",
  isPending: false,
  onSubmit: vi.fn(),
};

describe("DisplayNameField", () => {
  it("renderiza el initialValue en el input", () => {
    render(<DisplayNameField {...baseProps} />);
    expect(screen.getByLabelText(/nombre visible/i)).toHaveValue("Juan");
  });

  it("submit deshabilitado cuando no hay cambios", () => {
    render(<DisplayNameField {...baseProps} />);
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("submit deshabilitado con valor vacío después de cambio", () => {
    render(<DisplayNameField {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "" } });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("submit habilitado con valor nuevo válido", () => {
    render(<DisplayNameField {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "María" } });
    expect(screen.getByRole("button", { name: /guardar/i })).not.toBeDisabled();
  });

  it("invoca onSubmit con el valor trim cuando se hace submit", () => {
    const onSubmit = vi.fn();
    render(<DisplayNameField {...baseProps} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "  María  " } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).toHaveBeenCalledWith("María");
  });

  it("muestra estado pendiente con label distinto", () => {
    render(<DisplayNameField {...baseProps} initialValue="Juan" isPending />);
    expect(screen.getByRole("button")).toHaveTextContent(/guardando/i);
  });

  it("muestra errorMessage cuando se pasa", () => {
    render(<DisplayNameField {...baseProps} errorMessage="Algo falló" />);
    expect(screen.getByText("Algo falló")).toBeInTheDocument();
  });

  it("no permite ingresar más caracteres que el máximo", () => {
    render(<DisplayNameField {...baseProps} />);
    const input = screen.getByLabelText(/nombre visible/i) as HTMLInputElement;
    expect(input.maxLength).toBe(MAX_DISPLAY_NAME_LENGTH);
  });
});
