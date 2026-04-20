import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ROUTES } from "@/shared/constants/routes";
import { TermsPage } from "./TermsPage";

const BASE_PROPS = {
  title: "Términos de uso",
  lastUpdated: "Última actualización: abril de 2026",
  intro: "Al usar Ambulante aceptás estos términos.",
  sections: [
    { title: "Descripción del servicio", body: "Ambulante muestra tiendas ambulantes." },
    { title: "Ley aplicable", body: "Rigen las leyes de la República Argentina." },
  ],
  privacyLinkLabel: "Ver política de privacidad",
  backToHomeLabel: "Volver al inicio",
  relatedLinksLabel: "Páginas relacionadas",
};

describe("TermsPage", () => {
  it("renders the main heading", () => {
    render(<TermsPage {...BASE_PROPS} />);
    expect(screen.getByRole("heading", { level: 1, name: "Términos de uso" })).toBeInTheDocument();
  });

  it("renders the last-updated notice", () => {
    render(<TermsPage {...BASE_PROPS} />);
    expect(screen.getByText("Última actualización: abril de 2026")).toBeInTheDocument();
  });

  it("renders section headings as h2", () => {
    render(<TermsPage {...BASE_PROPS} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(BASE_PROPS.sections.length);
  });

  it("renders the intro text", () => {
    render(<TermsPage {...BASE_PROPS} />);
    expect(screen.getByText(BASE_PROPS.intro)).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    render(<TermsPage {...BASE_PROPS} />);
    const link = screen.getByRole("link", { name: "Volver al inicio" });
    expect(link).toHaveAttribute("href", ROUTES.public.home);
  });

  it("renders a link to the privacy policy page", () => {
    render(<TermsPage {...BASE_PROPS} />);
    const link = screen.getByRole("link", { name: "Ver política de privacidad" });
    expect(link).toHaveAttribute("href", ROUTES.legal.privacy);
  });

  it("renders the related links nav with aria-label", () => {
    render(<TermsPage {...BASE_PROPS} />);
    expect(screen.getByRole("navigation", { name: "Páginas relacionadas" })).toBeInTheDocument();
  });
});
