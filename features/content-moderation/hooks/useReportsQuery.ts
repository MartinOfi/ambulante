import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { REPORT_STATUS } from "@/features/content-moderation/constants";
import type { Report } from "@/features/content-moderation/schemas/content-moderation.schemas";

async function fetchPendingReports(): Promise<readonly Report[]> {
  const status = encodeURIComponent(REPORT_STATUS.PENDING);
  const res = await fetch(`/api/admin/reports?status=${status}`, { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `fetchPendingReports: ${res.status}`);
  }
  const body = (await res.json()) as { data: Report[] };
  return body.data;
}

export function useReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports.byStatus(REPORT_STATUS.PENDING),
    queryFn: fetchPendingReports,
  });
}
