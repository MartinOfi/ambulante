import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { KPI_STATUS } from "./KpiCard.types";
import type { KpiCardProps, KpiStatus } from "./KpiCard.types";

const STATUS_CLASSES: Record<KpiStatus, string> = {
  [KPI_STATUS.SUCCESS]: "bg-green-100 text-green-800",
  [KPI_STATUS.WARNING]: "bg-yellow-100 text-yellow-800",
  [KPI_STATUS.DANGER]: "bg-red-100 text-red-800",
  [KPI_STATUS.NEUTRAL]: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<KpiStatus, string> = {
  [KPI_STATUS.SUCCESS]: "Bien",
  [KPI_STATUS.WARNING]: "Atención",
  [KPI_STATUS.DANGER]: "Bajo objetivo",
  [KPI_STATUS.NEUTRAL]: "—",
};

export function KpiCard({ label, value, description, status, target }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2">
          <span
            data-status={status}
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {target !== undefined && <span className="text-xs text-muted-foreground">{target}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
