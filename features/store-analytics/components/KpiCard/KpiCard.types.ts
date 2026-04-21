export type KpiStatus = "success" | "warning" | "danger" | "neutral";

export interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly status: KpiStatus;
  readonly target?: string;
}
