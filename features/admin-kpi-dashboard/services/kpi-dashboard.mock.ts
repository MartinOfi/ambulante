import { kpiSnapshotSchema } from "@/features/admin-kpi-dashboard/schemas/kpi-dashboard.schemas";
import { KPI_MOCK_DELAY_MS } from "@/features/admin-kpi-dashboard/constants/kpi-dashboard.constants";
import type {
  KpiDashboardService,
  KpiSnapshot,
} from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";
import { logger } from "@/shared/utils/logger";

const SEED_SNAPSHOT = {
  ordersPerDay: 42,
  acceptanceRate: 0.72,
  completionRate: 0.65,
  avgResponseTimeMs: 142_000,
  expirationRate: 0.12,
  activeStoresConcurrent: 8,
  period: "day" as const,
  computedAt: new Date("2026-04-20T10:00:00Z"),
};

function simulateDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, KPI_MOCK_DELAY_MS));
}

export const kpiDashboardService: KpiDashboardService = {
  async fetchKpiSnapshot(): Promise<KpiSnapshot> {
    await simulateDelay();

    const parsed = kpiSnapshotSchema.safeParse(SEED_SNAPSHOT);

    if (!parsed.success) {
      logger.error("kpi-dashboard: invalid seed snapshot", { issues: parsed.error.issues });
      throw new Error("Datos de KPI inválidos");
    }

    return parsed.data;
  },
};
