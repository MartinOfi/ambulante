"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";

export function useStoreByIdQuery(storeId: string | null) {
  const query = useQuery({
    queryKey: storeId ? queryKeys.stores.byId(storeId) : queryKeys.stores.all(),
    queryFn: async () => {
      if (!storeId) throw new Error("storeId required");
      return storesService.findById(storeId);
    },
    enabled: storeId !== null,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useStoreByIdQuery: fetch failed", {
        storeId,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, storeId]);

  return query;
}
