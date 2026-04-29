"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { authService } from "@/shared/services";
import { cancelOrder } from "@/features/orders/actions";
import type { CancelOrderInput } from "@/features/orders/cancel.schemas";

interface MutateContext {
  readonly previous: Order | undefined;
}

export interface CancelOrderSuccess {
  readonly publicId: string;
  readonly status: typeof ORDER_STATUS.CANCELADO;
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CancelOrderInput): Promise<CancelOrderSuccess> => {
      const session = await authService.getSession();
      if (session === null || session.user.role !== USER_ROLES.client) {
        logger.warn("useCancelOrderMutation: unauthorized cancel attempt", {
          publicId: input.publicId,
          role: session?.user.role ?? null,
        });
        throw new Error("Unauthorized: only client role can cancel orders");
      }

      const result = await cancelOrder(input);
      if (result.ok === false) throw new Error(result.message);
      return { publicId: result.publicId, status: result.status };
    },

    onMutate: async (input: CancelOrderInput): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(input.publicId) });

      const previous = queryClient.getQueryData<Order>(queryKeys.orders.byId(input.publicId));

      queryClient.setQueryData<Order>(queryKeys.orders.byId(input.publicId), (old) => {
        if (old === undefined) return old;
        return { ...old, status: ORDER_STATUS.CANCELADO };
      });

      return { previous };
    },

    onError: (error: unknown, input: CancelOrderInput, context: MutateContext | undefined) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.orders.byId(input.publicId), context.previous);
      }

      logger.error("useCancelOrderMutation: cancel failed", {
        publicId: input.publicId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data, _error, input: CancelOrderInput) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(input.publicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
}
