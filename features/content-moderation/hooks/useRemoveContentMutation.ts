import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { contentModerationService } from "@/features/content-moderation/services/content-moderation.mock";

export function useRemoveContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => contentModerationService.removeContent(reportId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
