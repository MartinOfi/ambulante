import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { removeContentAction } from "@/features/content-moderation/server-actions/content-moderation-actions";

export function useRemoveContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const result = await removeContentAction(reportId);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
