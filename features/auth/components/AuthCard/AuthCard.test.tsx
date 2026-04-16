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

  it("renders children", () => {
    render(
      <AuthCard title="Título">
        <span>formulario</span>
      </AuthCard>,
    );
    expect(screen.getByText("formulario")).toBeInTheDocument();
  });
});
