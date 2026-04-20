import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/test-utils";
import { ClientShell } from "./ClientShell";

describe("ClientShell", () => {
  it("renders children inside main", () => {
    renderWithProviders(
      <ClientShell activePath="/map">
        <p>contenido de prueba</p>
      </ClientShell>,
    );
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("contenido de prueba")).toBeInTheDocument();
  });

  it("renders the bottom nav", () => {
    renderWithProviders(
      <ClientShell activePath="/map">
        <span />
      </ClientShell>,
    );
    expect(screen.getByRole("navigation", { name: /navegación principal/i })).toBeInTheDocument();
  });

  it("renders brand header with app name", () => {
    renderWithProviders(
      <ClientShell activePath="/map">
        <span />
      </ClientShell>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(/ambulante/i)).toBeInTheDocument();
  });

  it("passes activePath down to ClientBottomNav", () => {
    renderWithProviders(
      <ClientShell activePath="/orders">
        <span />
      </ClientShell>,
    );
    expect(screen.getByRole("link", { name: /pedidos/i })).toHaveAttribute("aria-current", "page");
  });
});
