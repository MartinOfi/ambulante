"use client";

import { useQuery } from "@tanstack/react-query";
import { slowQueryArraySchema } from "@/shared/types/observability";
import type { SlowQuery } from "@/shared/types/observability";
import { queryKeys } from "@/shared/query/keys";
import { SLOW_QUERIES_STALE_TIME_MS } from "@/features/admin-observability/constants/admin-observability.constants";

async function fetchSlowQueries(): Promise<SlowQuery[]> {
  const res = await fetch("/api/admin/slow-queries");
  if (!res.ok) {
    throw new Error("Error obteniendo queries lentas.");
  }
  const json: unknown = await res.json();
  const parsed = slowQueryArraySchema.safeParse((json as { data?: unknown }).data);
  if (!parsed.success) {
    throw new Error("Error obteniendo queries lentas.");
  }
  return parsed.data;
}

export function useSlowQueriesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.slowQueries(),
    queryFn: fetchSlowQueries,
    staleTime: SLOW_QUERIES_STALE_TIME_MS,
  });
}
