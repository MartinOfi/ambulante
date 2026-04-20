import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@/shared/constants/routes";
import { StoreNav } from "./StoreNav";

describe("StoreNav", () => {
  it("renders Dashboard nav item", () => {
    render(<StoreNav />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Pedidos nav item", () => {
    render(<StoreNav />);
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
  });

  it("renders Catálogo nav item", () => {
    render(<StoreNav />);
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
  });

  it("renders Perfil nav item", () => {
    render(<StoreNav />);
    expect(screen.getByText("Perfil")).toBeInTheDocument();
  });

  it("Dashboard link points to store dashboard route", () => {
    render(<StoreNav />);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", ROUTES.store.dashboard);
  });

  it("Pedidos link points to store orders route", () => {
    render(<StoreNav />);
    const link = screen.getByRole("link", { name: /pedidos/i });
    expect(link).toHaveAttribute("href", ROUTES.store.orders);
  });

  it("Catálogo link points to store catalog route", () => {
    render(<StoreNav />);
    const link = screen.getByRole("link", { name: /catálogo/i });
    expect(link).toHaveAttribute("href", ROUTES.store.catalog);
  });

  it("Perfil link points to store profile route", () => {
    render(<StoreNav />);
    const link = screen.getByRole("link", { name: /perfil/i });
    expect(link).toHaveAttribute("href", ROUTES.store.profile);
  });

  it("marks active link with aria-current=page", () => {
    render(<StoreNav currentPath={ROUTES.store.dashboard} />);
    const activeLink = screen.getByRole("link", { name: /dashboard/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("does not mark inactive links with aria-current", () => {
    render(<StoreNav currentPath={ROUTES.store.dashboard} />);
    const inactiveLink = screen.getByRole("link", { name: /pedidos/i });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });
});
