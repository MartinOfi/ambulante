import { KpiCard } from "@/features/admin-kpi-dashboard/components/KpiCard";
import type { KpiDashboardProps } from "./KpiDashboard.types";

export function KpiDashboard({ cards, isLoading, error }: KpiDashboardProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm py-8">Cargando métricas...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm py-8">No se pudieron cargar las métricas.</p>;
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
