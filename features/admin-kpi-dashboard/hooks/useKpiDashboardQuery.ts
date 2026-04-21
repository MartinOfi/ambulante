import { useQuery } from "@tanstack/react-query";
import { kpiDashboardService } from "@/features/admin-kpi-dashboard/services/kpi-dashboard.mock";
import { KPI_QUERY_STALE_TIME_MS } from "@/features/admin-kpi-dashboard/constants/kpi-dashboard.constants";

const KPI_DASHBOARD_QUERY_KEY = ["kpiDashboard"] as const;

export function useKpiDashboardQuery() {
  return useQuery({
    queryKey: KPI_DASHBOARD_QUERY_KEY,
    queryFn: () => kpiDashboardService.fetchKpiSnapshot(),
    staleTime: KPI_QUERY_STALE_TIME_MS,
    retry: false,
  });
}
