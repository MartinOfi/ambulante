import type { KpiCardProps } from "@/features/admin-kpi-dashboard/components/KpiCard";

export interface KpiDashboardProps {
  readonly cards: readonly KpiCardProps[];
  readonly isLoading: boolean;
  readonly error: Error | null;
}
