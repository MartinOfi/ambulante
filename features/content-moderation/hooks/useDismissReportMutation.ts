import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { dismissReportAction } from "@/features/content-moderation/server-actions/content-moderation-actions";

export function useDismissReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const result = await dismissReportAction(reportId);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
