"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type { OrderStatus } from "@/shared/constants/order";
import { ordersService } from "@/features/orders/services/orders.mock";

export interface UseOrdersQueryInput {
  readonly clientId: string | null;
  readonly status?: OrderStatus;
}

export function useOrdersQuery({ clientId, status }: UseOrdersQueryInput) {
  const query = useQuery({
    queryKey: clientId ? queryKeys.orders.byUser(clientId) : queryKeys.orders.all(),
    queryFn: async () => {
      if (!clientId) throw new Error("clientId required");
      return ordersService.findByUser({ clientId, status });
    },
    enabled: clientId !== null,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useOrdersQuery: fetch failed", {
        clientId,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, clientId]);

  return query;
}
