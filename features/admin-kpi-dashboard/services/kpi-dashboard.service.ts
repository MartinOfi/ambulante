import type { OrderRepository } from "@/shared/repositories/order";
import type { StoreRepository } from "@/shared/repositories/store";
import { ORDER_STATUS } from "@/shared/constants/order";
import { kpiSnapshotSchema } from "@/features/admin-kpi-dashboard/schemas/kpi-dashboard.schemas";
import type {
  KpiDashboardService,
  KpiSnapshot,
} from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";
import { logger } from "@/shared/utils/logger";

const MS_PER_DAY = 86_400_000;

export function createKpiDashboardService(
  orderRepo: OrderRepository,
  storeRepo: StoreRepository,
): KpiDashboardService {
  return {
    async fetchKpiSnapshot(): Promise<KpiSnapshot> {
      const [orders, stores] = await Promise.all([orderRepo.findAll(), storeRepo.findAll()]);

      const total = orders.length;

      // ── ordersPerDay ───────────────────────────────────────────────────────
      // Use span of createdAt to estimate daily throughput.
      let ordersPerDay = 0;
      if (total > 0) {
        const timestamps = orders.map((o) => new Date(o.createdAt).getTime());
        const minTs = Math.min(...timestamps);
        const maxTs = Math.max(...timestamps);
        const spanDays = Math.max(1, Math.ceil((maxTs - minTs) / MS_PER_DAY));
        ordersPerDay = Math.round(total / spanDays);
      }

      // ── rates + avgResponseTimeMs (single pass) ────────────────────────────
      // Approximation: for ACEPTADO orders, updatedAt ≈ acceptance timestamp.
      const stats = orders.reduce(
        (acc, o) => {
          if (o.status === ORDER_STATUS.ACEPTADO) {
            acc.accepted += 1;
            const ms = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
            acc.totalResponseTimeMs += Math.max(0, ms);
          } else if (o.status === ORDER_STATUS.RECHAZADO) {
            acc.rejected += 1;
          } else if (o.status === ORDER_STATUS.FINALIZADO) {
            acc.finalized += 1;
          } else if (o.status === ORDER_STATUS.EXPIRADO) {
            acc.expired += 1;
          }
          return acc;
        },
        { accepted: 0, rejected: 0, finalized: 0, expired: 0, totalResponseTimeMs: 0 },
      );

      const { accepted, rejected, finalized, expired } = stats;
      const decisionDenominator = accepted + rejected;
      const acceptanceRate = decisionDenominator > 0 ? accepted / decisionDenominator : 0;

      // completionRate = finalized / (all orders that were accepted at some point)
      const everAccepted = accepted + finalized;
      const completionRate = everAccepted > 0 ? finalized / everAccepted : 0;

      const expirationRate = total > 0 ? expired / total : 0;

      const avgResponseTimeMs =
        stats.accepted > 0 ? Math.round(stats.totalResponseTimeMs / stats.accepted) : 0;

      // ── activeStoresConcurrent ─────────────────────────────────────────────
      const activeStoresConcurrent = stores.filter((s) => s.status === "open").length;

      const raw = {
        ordersPerDay,
        acceptanceRate,
        completionRate,
        avgResponseTimeMs,
        expirationRate,
        activeStoresConcurrent,
        period: "day" as const,
        computedAt: new Date(),
      };

      const parsed = kpiSnapshotSchema.safeParse(raw);
      if (!parsed.success) {
        logger.error("kpi-dashboard: invalid computed snapshot", { issues: parsed.error.issues });
        throw new Error("Datos de KPI inválidos");
      }

      return parsed.data;
    },
  };
}
