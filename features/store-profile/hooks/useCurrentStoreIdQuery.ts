"use client";

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";

export function useCurrentStoreIdQuery() {
  const storeQuery = useCurrentStoreQuery();
  return { ...storeQuery, data: storeQuery.data?.id ?? null };
}
