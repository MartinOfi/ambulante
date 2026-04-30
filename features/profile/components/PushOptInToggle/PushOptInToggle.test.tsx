import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { PushOptInToggle } from "./PushOptInToggle";

const baseProps = {
  isSubscribed: false,
  permission: "default" as const,
  isPending: false,
  isSupported: true,
  onToggle: vi.fn(),
};

describe("PushOptInToggle", () => {
  it("returns null cuando !isSupported", () => {
    const { container } = render(<PushOptInToggle {...baseProps} isSupported={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("muestra 'Activar notificaciones' cuando no está suscripto y permission default", () => {
    render(<PushOptInToggle {...baseProps} />);
    expect(screen.getByText(/activar notificaciones/i)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("muestra 'Notificaciones activas' cuando isSubscribed", () => {
    render(<PushOptInToggle {...baseProps} isSubscribed permission="granted" />);
    expect(screen.getByText(/notificaciones activas/i)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("muestra mensaje de denied cuando permission=denied", () => {
    render(<PushOptInToggle {...baseProps} permission="denied" />);
    expect(screen.getByText(/permiso denegado/i)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("invoca onToggle al hacer click", () => {
    const onToggle = vi.fn();
    render(<PushOptInToggle {...baseProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("switch deshabilitado mientras isPending", () => {
    render(<PushOptInToggle {...baseProps} isPending />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
