import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

export interface ReportCardProps {
  readonly report: Report;
  readonly isRemoving: boolean;
  readonly isDismissing: boolean;
  readonly onRemove: (reportId: string) => void;
  readonly onDismiss: (reportId: string) => void;
}
