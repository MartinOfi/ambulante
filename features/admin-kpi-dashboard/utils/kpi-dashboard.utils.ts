import { KPI_TARGETS } from "@/features/admin-kpi-dashboard/constants/kpi-dashboard.constants";
import type { KpiStatus } from "@/features/admin-kpi-dashboard/components/KpiCard";
import type { KpiCardProps } from "@/features/admin-kpi-dashboard/components/KpiCard";
import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatResponseTime(ms: number): string {
  const totalSeconds = Math.round(ms / MS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function rateStatus(value: number, min: number): KpiStatus {
  return value >= min ? "on-target" : "below-target";
}

export function invertedRateStatus(value: number, max: number): KpiStatus {
  return value <= max ? "on-target" : "below-target";
}

export function timeStatus(ms: number, maxMs: number): KpiStatus {
  return ms <= maxMs ? "on-target" : "below-target";
}

export function buildKpiCards(snapshot: KpiSnapshot): readonly KpiCardProps[] {
  return [
    {
      label: "Pedidos / día",
      value: String(snapshot.ordersPerDay),
      status: "baseline",
    },
    {
      label: "Tasa de aceptación",
      value: formatRate(snapshot.acceptanceRate),
      target: "objetivo: ≥ 60%",
      status: rateStatus(snapshot.acceptanceRate, KPI_TARGETS.ACCEPTANCE_RATE_MIN),
    },
    {
      label: "Tasa de finalización",
      value: formatRate(snapshot.completionRate),
      target: "objetivo: ≥ 70%",
      status: rateStatus(snapshot.completionRate, KPI_TARGETS.COMPLETION_RATE_MIN),
    },
    {
      label: "Tiempo de respuesta",
      value: formatResponseTime(snapshot.avgResponseTimeMs),
      target: "objetivo: < 3 min",
      status: timeStatus(snapshot.avgResponseTimeMs, KPI_TARGETS.AVG_RESPONSE_TIME_MAX_MS),
    },
    {
      label: "Tasa de expiración",
      value: formatRate(snapshot.expirationRate),
      target: "objetivo: < 15%",
      status: invertedRateStatus(snapshot.expirationRate, KPI_TARGETS.EXPIRATION_RATE_MAX),
    },
    {
      label: "Tiendas activas",
      value: String(snapshot.activeStoresConcurrent),
      status: "baseline",
    },
  ] as const;
}
