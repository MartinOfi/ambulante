import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { render } from "@/shared/test-utils";
import { NotificationOptIn } from "./NotificationOptIn";

const DEFAULT_PROPS = {
  isSubscribed: false,
  permission: "default" as const,
  isPending: false,
  isSupported: true,
  onToggle: vi.fn(),
};

describe("NotificationOptIn", () => {
  it("no renderiza nada si el browser no soporta notificaciones", () => {
    const { container } = render(<NotificationOptIn {...DEFAULT_PROPS} isSupported={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("muestra el label de activar cuando no está suscrito", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} />);
    expect(screen.getByText("Activar avisos de pedidos")).toBeInTheDocument();
  });

  it("muestra el label de activos cuando está suscrito", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} isSubscribed permission="granted" />);
    expect(screen.getByText("Avisos de pedidos activados")).toBeInTheDocument();
  });

  it("muestra el label de denegado cuando el permiso es denied", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} permission="denied" />);
    expect(screen.getByText("Permiso denegado en el navegador")).toBeInTheDocument();
  });

  it("el switch tiene aria-checked correcto según isSubscribed", () => {
    const { rerender } = render(<NotificationOptIn {...DEFAULT_PROPS} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");

    rerender(<NotificationOptIn {...DEFAULT_PROPS} isSubscribed permission="granted" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("llama onToggle al hacer click en el switch", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<NotificationOptIn {...DEFAULT_PROPS} onToggle={onToggle} />);

    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("el switch está deshabilitado durante isPending", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} isPending />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("el switch está deshabilitado cuando el permiso es denied", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} permission="denied" />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("muestra el helper text orientado a tienda", () => {
    render(<NotificationOptIn {...DEFAULT_PROPS} />);
    expect(screen.getByText(/recibí avisos de pedidos nuevos/i)).toBeInTheDocument();
  });
});
