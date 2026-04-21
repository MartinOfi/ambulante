import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { KpiCardProps, KpiStatus } from "./KpiCard.types";

const STATUS_LABEL: Record<KpiStatus, string> = {
  "on-target": "En objetivo",
  "below-target": "Bajo objetivo",
  baseline: "Midiendo",
};

const STATUS_VARIANT: Record<KpiStatus, "default" | "secondary" | "destructive"> = {
  "on-target": "default",
  "below-target": "destructive",
  baseline: "secondary",
};

export function KpiCard({ label, value, target, status }: KpiCardProps) {
  return (
    <Card className={cn("flex flex-col gap-2")}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        {target ? <span className="text-xs text-muted-foreground">{target}</span> : <span />}
        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      </CardContent>
    </Card>
  );
}
