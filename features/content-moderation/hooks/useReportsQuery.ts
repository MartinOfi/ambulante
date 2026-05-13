import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { REPORT_STATUS } from "@/features/content-moderation/constants";
import { contentModerationService } from "@/features/content-moderation/services/content-moderation.adapter";

export function useReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports.byStatus(REPORT_STATUS.PENDING),
    queryFn: () => contentModerationService.listReports({ status: REPORT_STATUS.PENDING }),
  });
}
