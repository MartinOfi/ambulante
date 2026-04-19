"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { ordersService } from "@/features/orders/services";

export function useConfirmOnTheWayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersService.confirmOnTheWay(orderId),

    onError: (error: unknown, orderId: string) => {
      logger.error("useConfirmOnTheWayMutation: confirm failed", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data: unknown, _error: unknown, orderId: string) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
}
