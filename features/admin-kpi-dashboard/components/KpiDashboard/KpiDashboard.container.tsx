"use client";

import { useKpiDashboardQuery } from "@/features/admin-kpi-dashboard/hooks/useKpiDashboardQuery";
import { KpiDashboard } from "./KpiDashboard";

export function KpiDashboardContainer() {
  const { data, isPending, error } = useKpiDashboardQuery();

  return <KpiDashboard snapshot={data ?? null} isLoading={isPending} error={error} />;
}
