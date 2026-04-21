import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiDashboard } from "./KpiDashboard";
import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const mockSnapshot: KpiSnapshot = {
  ordersPerDay: 42,
  acceptanceRate: 0.72,
  completionRate: 0.65,
  avgResponseTimeMs: 142_000,
  expirationRate: 0.12,
  activeStoresConcurrent: 8,
  period: "day",
  computedAt: new Date("2026-04-20T10:00:00Z"),
};

describe("KpiDashboard", () => {
  it("renders all 6 KPI labels when snapshot is provided", () => {
    render(<KpiDashboard snapshot={mockSnapshot} isLoading={false} error={null} />);

    expect(screen.getByText("Pedidos / día")).toBeInTheDocument();
    expect(screen.getByText("Tasa de aceptación")).toBeInTheDocument();
    expect(screen.getByText("Tasa de finalización")).toBeInTheDocument();
    expect(screen.getByText("Tiempo de respuesta")).toBeInTheDocument();
    expect(screen.getByText("Tasa de expiración")).toBeInTheDocument();
    expect(screen.getByText("Tiendas activas")).toBeInTheDocument();
  });

  it("renders formatted KPI values", () => {
    render(<KpiDashboard snapshot={mockSnapshot} isLoading={false} error={null} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    render(<KpiDashboard snapshot={null} isLoading={true} error={null} />);

    expect(screen.getByText("Cargando métricas...")).toBeInTheDocument();
  });

  it("renders error message when error is provided", () => {
    render(<KpiDashboard snapshot={null} isLoading={false} error={new Error("failed to fetch")} />);

    expect(screen.getByText("No se pudieron cargar las métricas.")).toBeInTheDocument();
  });

  it("renders nothing when snapshot is null and not loading", () => {
    const { container } = render(<KpiDashboard snapshot={null} isLoading={false} error={null} />);

    expect(container.firstChild).toBeNull();
  });
});
