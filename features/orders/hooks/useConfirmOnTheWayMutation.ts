"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { confirmOnTheWay } from "@/features/orders/actions";

export function useConfirmOnTheWayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await confirmOnTheWay(orderId);
      if (!result.ok) throw new Error(result.message);
      return result;
    },

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
