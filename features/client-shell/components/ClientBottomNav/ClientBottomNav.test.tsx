import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientBottomNav } from "./ClientBottomNav";

describe("ClientBottomNav", () => {
  it("renders all 3 nav items", () => {
    render(<ClientBottomNav activePath="/map" />);
    expect(screen.getByRole("link", { name: /mapa/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /perfil/i })).toBeInTheDocument();
  });

  it("marks active nav item with aria-current='page'", () => {
    render(<ClientBottomNav activePath="/orders" />);
    const ordersLink = screen.getByRole("link", { name: /pedidos/i });
    expect(ordersLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark non-active items with aria-current", () => {
    render(<ClientBottomNav activePath="/orders" />);
    expect(screen.getByRole("link", { name: /mapa/i })).not.toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /perfil/i })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders correct href for each nav item", () => {
    render(<ClientBottomNav activePath="/map" />);
    expect(screen.getByRole("link", { name: /mapa/i })).toHaveAttribute("href", "/map");
    expect(screen.getByRole("link", { name: /pedidos/i })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/profile");
  });

  it("has accessible nav landmark with label", () => {
    render(<ClientBottomNav activePath="/map" />);
    expect(screen.getByRole("navigation", { name: /navegación principal/i })).toBeInTheDocument();
  });

  it("marks /map as active when activePath is /map", () => {
    render(<ClientBottomNav activePath="/map" />);
    expect(screen.getByRole("link", { name: /mapa/i })).toHaveAttribute("aria-current", "page");
  });

  it("marks /profile as active when activePath is /profile", () => {
    render(<ClientBottomNav activePath="/profile" />);
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("aria-current", "page");
  });
});
