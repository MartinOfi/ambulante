import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils";
import { TermsPage } from "./TermsPage";

describe("TermsPage", () => {
  it("renders the main heading", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: /términos de uso/i })).toBeInTheDocument();
  });

  it("renders the last-updated notice", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByText(/última actualización/i)).toBeInTheDocument();
  });

  it("renders the service description section", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByText(/descripción del servicio/i)).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    renderWithProviders(<TermsPage />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders a link to the privacy policy page", () => {
    renderWithProviders(<TermsPage />);
    const link = screen.getByRole("link", { name: /política de privacidad/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/legal/privacy");
  });

  it("renders the governing law section referencing Argentina", () => {
    renderWithProviders(<TermsPage />);
    expect(screen.getByText(/argentina/i)).toBeInTheDocument();
  });
});
