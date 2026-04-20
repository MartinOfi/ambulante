"use client";

import { useReportsQuery } from "@/features/content-moderation/hooks/useReportsQuery";
import { useRemoveContentMutation } from "@/features/content-moderation/hooks/useRemoveContentMutation";
import { useDismissReportMutation } from "@/features/content-moderation/hooks/useDismissReportMutation";
import { ModerationQueue } from "./ModerationQueue";

export function ModerationQueueContainer() {
  const { data: reports = [], isLoading } = useReportsQuery();
  const removeMutation = useRemoveContentMutation();
  const dismissMutation = useDismissReportMutation();

  return (
    <ModerationQueue
      reports={reports}
      isLoading={isLoading}
      removingId={removeMutation.isPending ? (removeMutation.variables ?? null) : null}
      dismissingId={dismissMutation.isPending ? (dismissMutation.variables ?? null) : null}
      onRemove={(reportId) => removeMutation.mutate(reportId)}
      onDismiss={(reportId) => dismissMutation.mutate(reportId)}
    />
  );
}
