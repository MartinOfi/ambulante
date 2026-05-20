import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { rejectStoreAction } from "@/features/store-validation/server-actions/store-validation-actions";
import type {
  PendingStore,
  RejectStoreInput,
} from "@/features/store-validation/types/store-validation.types";

interface MutateContext {
  readonly previousQueue: readonly PendingStore[] | undefined;
}

export function useRejectStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RejectStoreInput, MutateContext>({
    mutationFn: async (input: RejectStoreInput) => {
      const result = await rejectStoreAction(input);
      if (!result.ok) throw new Error(result.error);
    },

    onMutate: async (input: RejectStoreInput): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.stores.pending() });

      const previousQueue = queryClient.getQueryData<readonly PendingStore[]>(
        queryKeys.stores.pending(),
      );

      queryClient.setQueryData<readonly PendingStore[]>(queryKeys.stores.pending(), (old) => {
        if (old === undefined) return old;
        return old.filter((store) => store.id !== input.storeId);
      });

      return { previousQueue };
    },

    onError: (error: Error, input: RejectStoreInput, context: MutateContext | undefined) => {
      if (context?.previousQueue !== undefined) {
        queryClient.setQueryData(queryKeys.stores.pending(), context.previousQueue);
      }

      logger.error("useRejectStoreMutation: reject failed", {
        storeId: input.storeId,
        error: error.message,
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stores.pending() });
    },
  });
}
