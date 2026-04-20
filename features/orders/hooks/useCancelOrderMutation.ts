"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { ordersService } from "@/features/orders/services";
import { authService } from "@/shared/services/auth";

interface MutateContext {
  readonly previous: Order | undefined;
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const session = await authService.getSession();
      if (session === null || session.user.role !== USER_ROLES.client) {
        logger.warn("useCancelOrderMutation: unauthorized cancel attempt", {
          orderId,
          role: session?.user.role ?? null,
        });
        throw new Error("Unauthorized: only client role can cancel orders");
      }
      return ordersService.cancel(orderId);
    },

    onMutate: async (orderId: string): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(orderId) });

      const previous = queryClient.getQueryData<Order>(queryKeys.orders.byId(orderId));

      queryClient.setQueryData<Order>(queryKeys.orders.byId(orderId), (old) => {
        if (old === undefined) return old;
        return { ...old, status: ORDER_STATUS.CANCELADO };
      });

      return { previous };
    },

    onError: (error: unknown, orderId: string, context: MutateContext | undefined) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.orders.byId(orderId), context.previous);
      }

      logger.error("useCancelOrderMutation: cancel failed", {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data: Order | undefined, _error: unknown, orderId: string) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
}
