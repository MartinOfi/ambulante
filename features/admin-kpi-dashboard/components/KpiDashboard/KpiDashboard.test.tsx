import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiDashboard } from "./KpiDashboard";
import type { KpiCardProps } from "@/features/admin-kpi-dashboard/components/KpiCard";

const mockCards: KpiCardProps[] = [
  { label: "Pedidos / día", value: "42", status: "baseline" },
  { label: "Tasa de aceptación", value: "72%", target: "objetivo: ≥ 60%", status: "on-target" },
  {
    label: "Tasa de finalización",
    value: "65%",
    target: "objetivo: ≥ 70%",
    status: "below-target",
  },
  {
    label: "Tiempo de respuesta",
    value: "2 min 22 seg",
    target: "objetivo: < 3 min",
    status: "on-target",
  },
  { label: "Tasa de expiración", value: "12%", target: "objetivo: < 15%", status: "on-target" },
  { label: "Tiendas activas", value: "8", status: "baseline" },
];

describe("KpiDashboard", () => {
  it("renders all 6 KPI labels when cards are provided", () => {
    render(<KpiDashboard cards={mockCards} isLoading={false} error={null} />);

    expect(screen.getByText("Pedidos / día")).toBeInTheDocument();
    expect(screen.getByText("Tasa de aceptación")).toBeInTheDocument();
    expect(screen.getByText("Tasa de finalización")).toBeInTheDocument();
    expect(screen.getByText("Tiempo de respuesta")).toBeInTheDocument();
    expect(screen.getByText("Tasa de expiración")).toBeInTheDocument();
    expect(screen.getByText("Tiendas activas")).toBeInTheDocument();
  });

  it("renders KPI values from cards", () => {
    render(<KpiDashboard cards={mockCards} isLoading={false} error={null} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders loading state when isLoading is true", () => {
    render(<KpiDashboard cards={[]} isLoading={true} error={null} />);

    expect(screen.getByText("Cargando métricas...")).toBeInTheDocument();
  });

  it("renders error message when error is provided", () => {
    render(<KpiDashboard cards={[]} isLoading={false} error={new Error("failed to fetch")} />);

    expect(screen.getByText("No se pudieron cargar las métricas.")).toBeInTheDocument();
  });

  it("renders nothing when cards is empty and not loading", () => {
    const { container } = render(<KpiDashboard cards={[]} isLoading={false} error={null} />);

    expect(container.firstChild).toBeNull();
  });
});
