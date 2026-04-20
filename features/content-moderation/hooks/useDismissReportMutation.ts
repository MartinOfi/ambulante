import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { contentModerationService } from "@/features/content-moderation/services/content-moderation.mock";

export function useDismissReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => contentModerationService.dismissReport(reportId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
