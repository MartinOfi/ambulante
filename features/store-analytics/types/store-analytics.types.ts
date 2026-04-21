export type AnalyticsPeriod = 1 | 7 | 30;

export interface StoreKpiSummary {
  readonly periodDays: AnalyticsPeriod;
  readonly ordersTotal: number;
  readonly ordersPerDay: number;
  readonly acceptanceRate: number;
  readonly finalizationRate: number;
  readonly avgResponseMs: number;
  readonly expirationRate: number;
  readonly activeDaysCount: number;
}

export interface StoreAnalyticsFilter {
  readonly storeId: string;
  readonly period: AnalyticsPeriod;
}
