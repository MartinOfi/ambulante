import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { catalogService } from "@/features/catalog/services/catalog.mock";

export function useCatalogQuery(storeId: string) {
  const query = useQuery({
    queryKey: queryKeys.catalog.byStore(storeId),
    queryFn: () => catalogService.findByStore(storeId),
    enabled: storeId.length > 0,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useCatalogQuery: fetch failed", {
        storeId,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, storeId]);

  return query;
}
