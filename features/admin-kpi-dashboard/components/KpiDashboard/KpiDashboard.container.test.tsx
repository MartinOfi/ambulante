import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils/render";
import { KpiDashboardContainer } from "./KpiDashboard.container";
import * as kpiDashboardMockModule from "@/features/admin-kpi-dashboard/services/kpi-dashboard.mock";
import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const mockSnapshot: KpiSnapshot = {
  ordersPerDay: 55,
  acceptanceRate: 0.68,
  completionRate: 0.71,
  avgResponseTimeMs: 95_000,
  expirationRate: 0.08,
  activeStoresConcurrent: 12,
  period: "day",
  computedAt: new Date("2026-04-20T12:00:00Z"),
};

describe("KpiDashboardContainer", () => {
  beforeEach(() => {
    vi.spyOn(kpiDashboardMockModule.kpiDashboardService, "fetchKpiSnapshot").mockResolvedValue(
      mockSnapshot,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders KPI data after successful fetch", async () => {
    renderWithProviders(<KpiDashboardContainer />);

    await waitFor(() => {
      expect(screen.getByText("Pedidos / día")).toBeInTheDocument();
    });

    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderWithProviders(<KpiDashboardContainer />);

    expect(screen.getByText("Cargando métricas...")).toBeInTheDocument();
  });

  it("shows error state when service fails", async () => {
    vi.spyOn(kpiDashboardMockModule.kpiDashboardService, "fetchKpiSnapshot").mockRejectedValue(
      new Error("network error"),
    );

    renderWithProviders(<KpiDashboardContainer />);

    await waitFor(() => {
      expect(screen.getByText("No se pudieron cargar las métricas.")).toBeInTheDocument();
    });
  });
});
