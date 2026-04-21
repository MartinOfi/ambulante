"use client";

import { useKpiDashboardQuery } from "@/features/admin-kpi-dashboard/hooks/useKpiDashboardQuery";
import { buildKpiCards } from "@/features/admin-kpi-dashboard/utils/kpi-dashboard.utils";
import { KpiDashboard } from "./KpiDashboard";

export function KpiDashboardContainer() {
  const { data, isPending, error } = useKpiDashboardQuery();

  return (
    <KpiDashboard cards={data ? buildKpiCards(data) : []} isLoading={isPending} error={error} />
  );
}
