"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { useTableChangesInvalidation } from "@/shared/query/useTableChangesInvalidation";
import { logger } from "@/shared/utils/logger";
import type { OrderStatus } from "@/shared/constants/order";
import { ordersService } from "@/features/orders/services";

export interface UseStoreOrdersQueryInput {
  readonly storeId: string | null;
  readonly status?: OrderStatus;
}

export function useStoreOrdersQuery({ storeId, status }: UseStoreOrdersQueryInput) {
  const queryKey = storeId ? queryKeys.orders.byStore(storeId) : queryKeys.orders.all();

  useTableChangesInvalidation({ table: "orders", filter: null, queryKey });

  return useQuery({
    queryKey,
    enabled: storeId !== null,
    queryFn: async () => {
      if (!storeId) throw new Error("storeId required");
      try {
        return await ordersService.findByStore({ storeId, status });
      } catch (err) {
        logger.error("useStoreOrdersQuery: fetch failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
  });
}
