import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

export interface KpiDashboardProps {
  readonly snapshot: KpiSnapshot | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
}
