import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

export interface ModerationQueueProps {
  readonly reports: readonly Report[];
  readonly isLoading: boolean;
  readonly removingId: string | null;
  readonly dismissingId: string | null;
  readonly onRemove: (reportId: string) => void;
  readonly onDismiss: (reportId: string) => void;
}
