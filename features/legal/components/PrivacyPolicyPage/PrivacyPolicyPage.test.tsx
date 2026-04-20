import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

describe("PrivacyPolicyPage", () => {
  it("renders the main heading", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /política de privacidad/i }),
    ).toBeInTheDocument();
  });

  it("renders the last-updated notice", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    expect(screen.getByText(/última actualización/i)).toBeInTheDocument();
  });

  it("renders the geolocation data section", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    expect(screen.getByText(/geolocalización/i)).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders a link to the terms page", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    const link = screen.getByRole("link", { name: /términos de uso/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/legal/terms");
  });

  it("renders the rights section referencing Ley 25.326", () => {
    renderWithProviders(<PrivacyPolicyPage />);
    const matches = screen.getAllByText(/25\.326/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
