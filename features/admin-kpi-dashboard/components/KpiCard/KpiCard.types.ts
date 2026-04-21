export type KpiStatus = "on-target" | "below-target" | "baseline";

export interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly target?: string;
  readonly status: KpiStatus;
}
