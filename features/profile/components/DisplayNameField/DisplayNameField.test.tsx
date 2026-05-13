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

function enterEditMode() {
  fireEvent.click(screen.getByRole("button", { name: /editar/i }));
}

describe("DisplayNameField", () => {
  it("muestra el nombre actual y el botón Editar en modo vista", () => {
    render(<DisplayNameField {...baseProps} />);
    expect(screen.getByText("Juan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("al hacer click en Editar muestra el input con el valor actual", () => {
    render(<DisplayNameField {...baseProps} />);
    enterEditMode();
    expect(screen.getByLabelText(/nombre visible/i)).toHaveValue("Juan");
  });

  it("submit deshabilitado cuando no hay cambios", () => {
    render(<DisplayNameField {...baseProps} />);
    enterEditMode();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("submit deshabilitado con valor vacío después de cambio", () => {
    render(<DisplayNameField {...baseProps} />);
    enterEditMode();
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "" } });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("submit habilitado con valor nuevo válido", () => {
    render(<DisplayNameField {...baseProps} />);
    enterEditMode();
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "María" } });
    expect(screen.getByRole("button", { name: /guardar/i })).not.toBeDisabled();
  });

  it("invoca onSubmit con el valor trim cuando se hace submit", () => {
    const onSubmit = vi.fn();
    render(<DisplayNameField {...baseProps} onSubmit={onSubmit} />);
    enterEditMode();
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "  María  " } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(onSubmit).toHaveBeenCalledWith("María");
  });

  it("muestra mensaje de éxito y vuelve a modo vista tras guardar", () => {
    const onSubmit = vi.fn();
    render(<DisplayNameField {...baseProps} onSubmit={onSubmit} />);
    enterEditMode();
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "María" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    expect(screen.getByText(/actualizado/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("muestra estado pendiente con label distinto", () => {
    render(<DisplayNameField {...baseProps} initialValue="Juan" isPending />);
    enterEditMode();
    expect(screen.getByRole("button", { name: /guardando/i })).toBeInTheDocument();
  });

  it("muestra errorMessage cuando se pasa", () => {
    render(<DisplayNameField {...baseProps} errorMessage="Algo falló" />);
    enterEditMode();
    expect(screen.getByText("Algo falló")).toBeInTheDocument();
  });

  it("no permite ingresar más caracteres que el máximo", () => {
    render(<DisplayNameField {...baseProps} />);
    enterEditMode();
    const input = screen.getByLabelText(/nombre visible/i) as HTMLInputElement;
    expect(input.maxLength).toBe(MAX_DISPLAY_NAME_LENGTH);
  });

  it("Cancelar vuelve a modo vista sin llamar onSubmit", () => {
    const onSubmit = vi.fn();
    render(<DisplayNameField {...baseProps} onSubmit={onSubmit} />);
    enterEditMode();
    fireEvent.change(screen.getByLabelText(/nombre visible/i), { target: { value: "Otro" } });
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });
});
