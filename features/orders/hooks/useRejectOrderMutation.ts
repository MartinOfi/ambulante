"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { authService } from "@/shared/services";
import { rejectOrder } from "@/features/orders/actions";
import type { StoreOrderTransitionInput } from "@/features/orders/store-transitions.schemas";

interface MutateContext {
  readonly previous: Order | undefined;
}

export interface RejectOrderSuccess {
  readonly publicId: string;
  readonly status: typeof ORDER_STATUS.RECHAZADO;
}

export function useRejectOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StoreOrderTransitionInput): Promise<RejectOrderSuccess> => {
      const session = await authService.getSession();
      if (session === null || session.user.role !== USER_ROLES.store) {
        logger.warn("useRejectOrderMutation: unauthorized reject attempt", {
          publicId: input.publicId,
          role: session?.user.role ?? null,
        });
        throw new Error("Unauthorized: only store role can reject orders");
      }
      const result = await rejectOrder(input);
      if (result.ok === false) throw new Error(result.message);
      return { publicId: result.publicId, status: result.status };
    },

    onMutate: async (input: StoreOrderTransitionInput): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(input.publicId) });

      const previous = queryClient.getQueryData<Order>(queryKeys.orders.byId(input.publicId));

      queryClient.setQueryData<Order>(queryKeys.orders.byId(input.publicId), (old) => {
        if (old === undefined) return old;
        return { ...old, status: ORDER_STATUS.RECHAZADO };
      });

      return { previous };
    },

    onError: (
      error: unknown,
      input: StoreOrderTransitionInput,
      context: MutateContext | undefined,
    ) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.orders.byId(input.publicId), context.previous);
      }

      logger.error("useRejectOrderMutation: reject failed", {
        publicId: input.publicId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (
      _data: RejectOrderSuccess | undefined,
      _error: unknown,
      input: StoreOrderTransitionInput,
    ) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(input.publicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byStorePrefix() });
    },
  });
}
