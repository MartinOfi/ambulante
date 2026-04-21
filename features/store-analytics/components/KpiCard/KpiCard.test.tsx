import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("renders the label", () => {
    render(
      <KpiCard
        label="Tasa de aceptación"
        value="72%"
        description="Pedidos aceptados vs recibidos"
        status="success"
        target="≥ 60%"
      />,
    );
    expect(screen.getByText("Tasa de aceptación")).toBeInTheDocument();
  });

  it("renders the value prominently", () => {
    render(
      <KpiCard
        label="Pedidos enviados"
        value="142"
        description="Total en el período"
        status="neutral"
      />,
    );
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("renders the target when provided", () => {
    render(
      <KpiCard
        label="Tasa de expiración"
        value="8%"
        description="Pedidos expirados"
        status="success"
        target="< 15%"
      />,
    );
    expect(screen.getByText("< 15%")).toBeInTheDocument();
  });

  it("does not render target element when not provided", () => {
    render(
      <KpiCard
        label="Días activos"
        value="5"
        description="Días con disponibilidad activa"
        status="neutral"
      />,
    );
    expect(screen.queryByText(/objetivo/i)).not.toBeInTheDocument();
  });

  it("renders description text", () => {
    render(
      <KpiCard
        label="Tiempo de respuesta"
        value="1m 45s"
        description="Promedio RECIBIDO → ACEPTADO"
        status="success"
        target="< 3 min"
      />,
    );
    expect(screen.getByText("Promedio RECIBIDO → ACEPTADO")).toBeInTheDocument();
  });

  it("applies danger status indicator for poor KPI", () => {
    const { container } = render(
      <KpiCard
        label="Tasa de aceptación"
        value="40%"
        description="Por debajo del objetivo"
        status="danger"
        target="≥ 60%"
      />,
    );
    // Status badge should have danger styling
    expect(container.querySelector('[data-status="danger"]')).toBeInTheDocument();
  });
});
