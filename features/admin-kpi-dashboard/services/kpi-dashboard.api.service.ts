import { z } from "zod";

import { kpiSnapshotSchema } from "@/features/admin-kpi-dashboard/schemas/kpi-dashboard.schemas";
import type {
  KpiDashboardService,
  KpiSnapshot,
} from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

// computedAt comes from JSON as an ISO string — coerce.date() handles the conversion.
const kpiApiResponseSchema = z.object({
  data: kpiSnapshotSchema.extend({ computedAt: z.coerce.date() }),
});

export const kpiApiService: KpiDashboardService = {
  async fetchKpiSnapshot(): Promise<KpiSnapshot> {
    const response = await fetch("/api/admin/kpi", { credentials: "include" });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error((body as { error?: string }).error ?? `Error HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    const parsed = kpiApiResponseSchema.safeParse(body);

    if (!parsed.success) {
      throw new Error("Respuesta de métricas inválida");
    }

    return parsed.data.data;
  },
};
