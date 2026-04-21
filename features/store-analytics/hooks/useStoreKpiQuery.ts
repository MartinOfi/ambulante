"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeAnalyticsService } from "@/features/store-analytics/services/store-analytics.service";
import type { AnalyticsPeriod } from "@/features/store-analytics/types/store-analytics.types";

const ANALYTICS_QUERY_KEYS = {
  byStore: (storeId: string, period: AnalyticsPeriod) =>
    ["analytics", "store", storeId, period] as const,
} as const;

export function useStoreKpiQuery(storeId: string) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(7);

  const query = useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.byStore(storeId, period),
    queryFn: () => storeAnalyticsService.getKpiSummary({ storeId, period }),
    enabled: storeId.length > 0,
  });

  return { ...query, period, setPeriod };
}
