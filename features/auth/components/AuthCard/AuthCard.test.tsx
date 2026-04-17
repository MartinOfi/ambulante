import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard } from "./AuthCard";

describe("AuthCard", () => {
  it("renders the brand name", () => {
    render(<AuthCard title="Iniciá sesión">contenido</AuthCard>);
    expect(screen.getByText("Ambulante")).toBeInTheDocument();
  });

  it("renders the provided title", () => {
    render(<AuthCard title="Recuperar contraseña">contenido</AuthCard>);
    expect(screen.getByText("Recuperar contraseña")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<AuthCard title="Iniciá sesión">contenido</AuthCard>);
    expect(screen.getByText("Tu mercado en movimiento")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <AuthCard title="Título">
        <span>formulario</span>
      </AuthCard>,
    );
    expect(screen.getByText("formulario")).toBeInTheDocument();
  });

  it("marks the decorative right panel as aria-hidden", () => {
    const { container } = render(<AuthCard title="Test">contenido</AuthCard>);
    const rightPanel = container.querySelector('[aria-hidden="true"]');
    expect(rightPanel).toBeInTheDocument();
  });

  it("renders the LiveMiniMap inside the right panel", () => {
    render(<AuthCard title="Test">contenido</AuthCard>);
    // LiveMiniMap renders a map canvas role or its container
    expect(screen.getByTestId("live-mini-map")).toBeInTheDocument();
  });
});
