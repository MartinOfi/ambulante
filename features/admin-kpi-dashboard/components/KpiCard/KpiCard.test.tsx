import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("renders the label", () => {
    render(<KpiCard label="Tasa de aceptación" value="72%" status="on-target" />);
    expect(screen.getByText("Tasa de aceptación")).toBeInTheDocument();
  });

  it("renders the value", () => {
    render(<KpiCard label="Pedidos / día" value="42" status="baseline" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the target text when provided", () => {
    render(
      <KpiCard
        label="Tasa de aceptación"
        value="72%"
        target="objetivo: ≥ 60%"
        status="on-target"
      />,
    );
    expect(screen.getByText("objetivo: ≥ 60%")).toBeInTheDocument();
  });

  it("does not render target when not provided", () => {
    render(<KpiCard label="Tiendas activas" value="8" status="baseline" />);
    expect(screen.queryByText(/objetivo/)).not.toBeInTheDocument();
  });

  it("shows on-target badge for on-target status", () => {
    render(<KpiCard label="Tasa de aceptación" value="72%" status="on-target" />);
    expect(screen.getByText("En objetivo")).toBeInTheDocument();
  });

  it("shows below-target badge for below-target status", () => {
    render(<KpiCard label="Tasa de finalización" value="65%" status="below-target" />);
    expect(screen.getByText("Bajo objetivo")).toBeInTheDocument();
  });

  it("shows baseline badge for baseline status", () => {
    render(<KpiCard label="Pedidos / día" value="42" status="baseline" />);
    expect(screen.getByText("Midiendo")).toBeInTheDocument();
  });
});
