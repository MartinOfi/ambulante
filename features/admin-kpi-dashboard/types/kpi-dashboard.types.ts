export type KpiPeriod = "day" | "week" | "month";

export interface KpiSnapshot {
  readonly ordersPerDay: number;
  readonly acceptanceRate: number;
  readonly completionRate: number;
  readonly avgResponseTimeMs: number;
  readonly expirationRate: number;
  readonly activeStoresConcurrent: number;
  readonly period: KpiPeriod;
  readonly computedAt: Date;
}

export interface KpiDashboardService {
  fetchKpiSnapshot(): Promise<KpiSnapshot>;
}
