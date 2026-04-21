"use client";

import { useCurrentStoreQuery } from "@/features/store-dashboard/hooks/useCurrentStoreQuery";
import { useStoreKpiQuery } from "@/features/store-analytics/hooks/useStoreKpiQuery";
import { StoreAnalyticsDashboard } from "./StoreAnalyticsDashboard";

export function StoreAnalyticsDashboardContainer() {
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? "";

  const { data, isLoading, isError, period, setPeriod } = useStoreKpiQuery(storeId);

  if (storeQuery.isPending) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="text-sm text-muted-foreground">Cargando métricas...</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="text-sm text-muted-foreground">Cargando métricas...</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="text-sm text-destructive">
          No se pudieron cargar las métricas. Intentá de nuevo.
        </p>
      </main>
    );
  }

  return (
    <StoreAnalyticsDashboard summary={data} selectedPeriod={period} onPeriodChange={setPeriod} />
  );
}
