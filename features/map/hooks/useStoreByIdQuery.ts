import { useEffect } from "react";
import { useQuery, skipToken } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";

export function useStoreByIdQuery(storeId: string | null) {
  const query = useQuery({
    queryKey: storeId
      ? queryKeys.stores.byId(storeId)
      : (["stores", "by-id", "__disabled__"] as const),
    queryFn: storeId ? () => storesService.findById(storeId) : skipToken,
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
