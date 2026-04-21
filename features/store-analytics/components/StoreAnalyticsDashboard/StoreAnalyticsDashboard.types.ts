import type {
  StoreKpiSummary,
  AnalyticsPeriod,
} from "@/features/store-analytics/types/store-analytics.types";

export interface StoreAnalyticsDashboardProps {
  readonly summary: StoreKpiSummary;
  readonly selectedPeriod: AnalyticsPeriod;
  readonly onPeriodChange: (period: AnalyticsPeriod) => void;
}
