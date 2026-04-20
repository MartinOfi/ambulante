import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { contentModerationService } from "@/features/content-moderation/services/content-moderation.adapter";

export function useReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports.all(),
    queryFn: () => contentModerationService.listReports(),
  });
}
