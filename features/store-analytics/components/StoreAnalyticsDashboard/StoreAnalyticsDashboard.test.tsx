import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StoreAnalyticsDashboard } from "./StoreAnalyticsDashboard";
import type { StoreKpiSummary } from "@/features/store-analytics/types/store-analytics.types";

const MOCK_SUMMARY: StoreKpiSummary = {
  periodDays: 7,
  ordersTotal: 42,
  ordersPerDay: 6,
  acceptanceRate: 0.72,
  finalizationRate: 0.8,
  avgResponseMs: 120_000,
  expirationRate: 0.08,
  activeDaysCount: 6,
};

describe("StoreAnalyticsDashboard", () => {
  it("renders all 6 KPI cards", () => {
    render(
      <StoreAnalyticsDashboard
        summary={MOCK_SUMMARY}
        selectedPeriod={7}
        onPeriodChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Pedidos / día")).toBeInTheDocument();
    expect(screen.getByText("Tasa de aceptación")).toBeInTheDocument();
    expect(screen.getByText("Tasa de finalización")).toBeInTheDocument();
    expect(screen.getByText("Tiempo de respuesta")).toBeInTheDocument();
    expect(screen.getByText("Tasa de expiración")).toBeInTheDocument();
    expect(screen.getByText("Días activos")).toBeInTheDocument();
  });

  it("shows formatted acceptance rate", () => {
    render(
      <StoreAnalyticsDashboard
        summary={MOCK_SUMMARY}
        selectedPeriod={7}
        onPeriodChange={vi.fn()}
      />,
    );
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("shows formatted avg response time in minutes", () => {
    render(
      <StoreAnalyticsDashboard
        summary={MOCK_SUMMARY}
        selectedPeriod={7}
        onPeriodChange={vi.fn()}
      />,
    );
    expect(screen.getByText("2 min")).toBeInTheDocument();
  });

  it("renders period selector buttons", () => {
    render(
      <StoreAnalyticsDashboard
        summary={MOCK_SUMMARY}
        selectedPeriod={7}
        onPeriodChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Hoy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7 días" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 días" })).toBeInTheDocument();
  });

  it("calls onPeriodChange when period button clicked", () => {
    const onPeriodChange = vi.fn();
    render(
      <StoreAnalyticsDashboard
        summary={MOCK_SUMMARY}
        selectedPeriod={7}
        onPeriodChange={onPeriodChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "30 días" }));
    expect(onPeriodChange).toHaveBeenCalledWith(30);
  });

  it("marks 'Bajo objetivo' for acceptance rate below 60%", () => {
    const lowAcceptanceSummary: StoreKpiSummary = {
      ...MOCK_SUMMARY,
      acceptanceRate: 0.45,
    };
    const { container } = render(
      <StoreAnalyticsDashboard
        summary={lowAcceptanceSummary}
        selectedPeriod={7}
        onPeriodChange={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('[data-status="danger"]').length).toBeGreaterThan(0);
  });
});
