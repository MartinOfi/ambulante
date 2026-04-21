"use client";

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { useStoreKpiQuery } from "@/features/store-analytics/hooks/useStoreKpiQuery";
import { StoreAnalyticsDashboard } from "./StoreAnalyticsDashboard";

function LoadingState() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <p className="text-sm text-muted-foreground">Cargando métricas...</p>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <p className="text-sm text-destructive">{message}</p>
    </main>
  );
}

export function StoreAnalyticsDashboardContainer() {
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? "";

  const { data, isLoading, isError, period, setPeriod } = useStoreKpiQuery(storeId);

  if (storeQuery.isPending || isLoading) {
    return <LoadingState />;
  }

  if (storeQuery.isError) {
    return <ErrorState message="No se pudo verificar la sesión de la tienda. Intentá de nuevo." />;
  }

  if (!storeQuery.data?.id) {
    return <ErrorState message="No se encontró la tienda asociada a tu cuenta." />;
  }

  if (isError || !data) {
    return <ErrorState message="No se pudieron cargar las métricas. Intentá de nuevo." />;
  }

  return (
    <StoreAnalyticsDashboard summary={data} selectedPeriod={period} onPeriodChange={setPeriod} />
  );
}
