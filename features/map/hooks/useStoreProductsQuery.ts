"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { productsService } from "@/shared/services/products";
import { logger } from "@/shared/utils/logger";

export function useStoreProductsQuery(storeId: string | null) {
  const query = useQuery({
    queryKey: storeId ? queryKeys.products.byStore(storeId) : queryKeys.products.all(),
    queryFn: async () => {
      if (!storeId) throw new Error("storeId required");
      return productsService.findByStore(storeId);
    },
    enabled: storeId !== null,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useStoreProductsQuery: fetch failed", {
        storeId,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, storeId]);

  return query;
}
