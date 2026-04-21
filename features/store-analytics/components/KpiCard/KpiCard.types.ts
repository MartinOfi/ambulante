export const KPI_STATUS = {
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  NEUTRAL: "neutral",
} as const;

export type KpiStatus = (typeof KPI_STATUS)[keyof typeof KPI_STATUS];

export interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly status: KpiStatus;
  readonly target?: string;
}
