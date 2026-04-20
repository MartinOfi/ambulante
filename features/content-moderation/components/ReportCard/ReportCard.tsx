import { Button } from "@/shared/components/ui/button";
import { REPORT_STATUS } from "@/features/content-moderation/constants";
import type { ReportCardProps } from "./ReportCard.types";

export function ReportCard({
  report,
  isRemoving,
  isDismissing,
  onRemove,
  onDismiss,
}: ReportCardProps) {
  const isPending = report.status === REPORT_STATUS.PENDING;
  const isActing = isRemoving || isDismissing;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-2">
        <p className="font-medium">{report.productName}</p>
        <p className="text-sm text-muted-foreground">{report.storeName}</p>
      </div>
      {isPending && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="destructive"
            disabled={isActing}
            onClick={() => onRemove(report.id)}
          >
            {isRemoving ? "Eliminando..." : "Eliminar contenido"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isActing}
            onClick={() => onDismiss(report.id)}
          >
            {isDismissing ? "Desestimando..." : "Desestimar"}
          </Button>
        </div>
      )}
    </div>
  );
}
