import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import type { KpiCardProps, KpiStatus } from "./KpiCard.types";

const STATUS_CLASSES: Record<KpiStatus, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<KpiStatus, string> = {
  success: "Bien",
  warning: "Atención",
  danger: "Bajo objetivo",
  neutral: "—",
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
