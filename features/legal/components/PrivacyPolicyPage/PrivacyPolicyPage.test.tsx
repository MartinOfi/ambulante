import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ROUTES } from "@/shared/constants/routes";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

const BASE_PROPS = {
  title: "Política de privacidad",
  lastUpdated: "Última actualización: abril de 2026",
  intro: "Intro texto con Ley 25.326 referencia.",
  sections: [
    { title: "¿Qué datos recopilamos?", body: "Recopilamos geolocalización." },
    { title: "Tus derechos", body: "Conforme a la Ley 25.326 podés acceder." },
  ],
  termsLinkLabel: "Ver términos de uso",
  backToHomeLabel: "Volver al inicio",
  relatedLinksLabel: "Páginas relacionadas",
};

describe("PrivacyPolicyPage", () => {
  it("renders the main heading", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Política de privacidad" }),
    ).toBeInTheDocument();
  });

  it("renders the last-updated notice", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    expect(screen.getByText("Última actualización: abril de 2026")).toBeInTheDocument();
  });

  it("renders section headings as h2", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(BASE_PROPS.sections.length);
  });

  it("renders the intro text", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    expect(screen.getByText(BASE_PROPS.intro)).toBeInTheDocument();
  });

  it("renders a back-to-home link pointing to /", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    const link = screen.getByRole("link", { name: "Volver al inicio" });
    expect(link).toHaveAttribute("href", ROUTES.public.home);
  });

  it("renders a link to the terms page", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    const link = screen.getByRole("link", { name: "Ver términos de uso" });
    expect(link).toHaveAttribute("href", ROUTES.legal.terms);
  });

  it("renders the related links nav with aria-label", () => {
    render(<PrivacyPolicyPage {...BASE_PROPS} />);
    expect(screen.getByRole("navigation", { name: "Páginas relacionadas" })).toBeInTheDocument();
  });
});
