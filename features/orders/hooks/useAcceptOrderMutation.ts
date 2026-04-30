"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { authService } from "@/shared/services";
import { acceptOrder } from "@/features/orders/actions";
import type { StoreOrderTransitionInput } from "@/features/orders/store-transitions.schemas";

interface MutateContext {
  readonly previous: Order | undefined;
}

export interface AcceptOrderSuccess {
  readonly publicId: string;
  readonly status: typeof ORDER_STATUS.ACEPTADO;
}

export function useAcceptOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StoreOrderTransitionInput): Promise<AcceptOrderSuccess> => {
      const session = await authService.getSession();
      if (session === null || session.user.role !== USER_ROLES.store) {
        logger.warn("useAcceptOrderMutation: unauthorized accept attempt", {
          publicId: input.publicId,
          role: session?.user.role ?? null,
        });
        throw new Error("Unauthorized: only store role can accept orders");
      }
      const result = await acceptOrder(input);
      if (result.ok === false) throw new Error(result.message);
      return { publicId: result.publicId, status: result.status };
    },

    onMutate: async (input: StoreOrderTransitionInput): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(input.publicId) });

      const previous = queryClient.getQueryData<Order>(queryKeys.orders.byId(input.publicId));

      queryClient.setQueryData<Order>(queryKeys.orders.byId(input.publicId), (old) => {
        if (old === undefined) return old;
        return { ...old, status: ORDER_STATUS.ACEPTADO };
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

      logger.error("useAcceptOrderMutation: accept failed", {
        publicId: input.publicId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (
      _data: AcceptOrderSuccess | undefined,
      _error: unknown,
      input: StoreOrderTransitionInput,
    ) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(input.publicId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byStorePrefix() });
    },
  });
}
