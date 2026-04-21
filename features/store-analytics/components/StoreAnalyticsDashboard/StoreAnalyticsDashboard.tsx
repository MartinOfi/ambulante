import type { StoreAnalyticsDashboardProps } from "./StoreAnalyticsDashboard.types";
import type { AnalyticsPeriod } from "@/features/store-analytics/types/store-analytics.types";
import { KPI_STATUS } from "@/features/store-analytics/components/KpiCard/KpiCard.types";
import type { KpiStatus } from "@/features/store-analytics/components/KpiCard/KpiCard.types";
import { KpiCard } from "@/features/store-analytics/components/KpiCard";

const KPI_TARGETS = {
  ACCEPTANCE_RATE: 0.6,
  FINALIZATION_RATE: 0.7,
  EXPIRATION_RATE_MAX: 0.15,
  AVG_RESPONSE_MAX_MS: 3 * 60 * 1000,
} as const;

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  1: "Hoy",
  7: "7 días",
  30: "30 días",
};

const PERIODS: readonly AnalyticsPeriod[] = [1, 7, 30];

function rateStatus(value: number, target: number, higherIsBetter: boolean): KpiStatus {
  if (value === 0) return KPI_STATUS.NEUTRAL;
  const ratio = higherIsBetter ? value / target : target / value;
  if (ratio >= 1) return KPI_STATUS.SUCCESS;
  if (ratio >= 0.8) return KPI_STATUS.WARNING;
  return KPI_STATUS.DANGER;
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatResponseTime(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  return `${minutes} min`;
}

export function StoreAnalyticsDashboard({
  summary,
  selectedPeriod,
  onPeriodChange,
}: StoreAnalyticsDashboardProps) {
  const acceptanceStatus = rateStatus(summary.acceptanceRate, KPI_TARGETS.ACCEPTANCE_RATE, true);
  const finalizationStatus = rateStatus(
    summary.finalizationRate,
    KPI_TARGETS.FINALIZATION_RATE,
    true,
  );
  const expirationStatus = rateStatus(
    summary.expirationRate,
    KPI_TARGETS.EXPIRATION_RATE_MAX,
    false,
  );
  const responseStatus = rateStatus(summary.avgResponseMs, KPI_TARGETS.AVG_RESPONSE_MAX_MS, false);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Métricas de tu tienda</h1>
        <div
          className="flex gap-1 rounded-lg border bg-muted p-1"
          role="group"
          aria-label="Período"
        >
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onPeriodChange(period)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Pedidos / día"
          value={summary.ordersPerDay.toFixed(1)}
          description={`${summary.ordersTotal} pedidos en total`}
          status={KPI_STATUS.NEUTRAL}
        />
        <KpiCard
          label="Tasa de aceptación"
          value={formatRate(summary.acceptanceRate)}
          description="RECIBIDO → ACEPTADO"
          status={acceptanceStatus}
          target="≥ 60%"
        />
        <KpiCard
          label="Tasa de finalización"
          value={formatRate(summary.finalizationRate)}
          description="ACEPTADO → FINALIZADO"
          status={finalizationStatus}
          target="≥ 70%"
        />
        <KpiCard
          label="Tiempo de respuesta"
          value={formatResponseTime(summary.avgResponseMs)}
          description="Promedio RECIBIDO → ACEPTADO"
          status={responseStatus}
          target="< 3 min"
        />
        <KpiCard
          label="Tasa de expiración"
          value={formatRate(summary.expirationRate)}
          description="Pedidos sin respuesta a tiempo"
          status={expirationStatus}
          target="< 15%"
        />
        <KpiCard
          label="Días activos"
          value={String(summary.activeDaysCount)}
          description={`de ${summary.periodDays} días del período`}
          status={KPI_STATUS.NEUTRAL}
        />
      </div>
    </main>
  );
}
