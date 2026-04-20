import { ReportCard } from "@/features/content-moderation/components/ReportCard";
import type { ModerationQueueProps } from "./ModerationQueue.types";

export function ModerationQueue({
  reports,
  isLoading,
  removingId,
  dismissingId,
  onRemove,
  onDismiss,
}: ModerationQueueProps) {
  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center">Cargando reportes...</p>;
  }

  if (reports.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No hay reportes pendientes</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reports.map((report) => (
        <li key={report.id}>
          <ReportCard
            report={report}
            isRemoving={removingId === report.id}
            isDismissing={dismissingId === report.id}
            onRemove={onRemove}
            onDismiss={onDismiss}
          />
        </li>
      ))}
    </ul>
  );
}
