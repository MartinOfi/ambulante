"use client";

import { useQuery } from "@tanstack/react-query";
import type { SlowQuery } from "@/shared/types/observability";
import { SLOW_QUERIES_STALE_TIME_MS } from "@/features/admin-observability/constants/admin-observability.constants";

const SLOW_QUERIES_KEY = ["admin", "slowQueries"] as const;

async function fetchSlowQueries(): Promise<SlowQuery[]> {
  const res = await fetch("/api/admin/slow-queries");
  if (!res.ok) {
    throw new Error("Error obteniendo queries lentas.");
  }
  const json = (await res.json()) as { data: SlowQuery[] };
  return json.data;
}

export function useSlowQueriesQuery() {
  return useQuery({
    queryKey: SLOW_QUERIES_KEY,
    queryFn: fetchSlowQueries,
    staleTime: SLOW_QUERIES_STALE_TIME_MS,
  });
}
