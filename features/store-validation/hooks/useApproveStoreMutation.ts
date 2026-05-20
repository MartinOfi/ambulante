import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { approveStoreAction } from "@/features/store-validation/server-actions/store-validation-actions";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

interface MutateContext {
  readonly previousQueue: readonly PendingStore[] | undefined;
}

export function useApproveStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutateContext>({
    mutationFn: async (storeId: string) => {
      const result = await approveStoreAction(storeId);
      if (!result.ok) throw new Error(result.error);
    },

    onMutate: async (storeId: string): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.stores.pending() });

      const previousQueue = queryClient.getQueryData<readonly PendingStore[]>(
        queryKeys.stores.pending(),
      );

      queryClient.setQueryData<readonly PendingStore[]>(queryKeys.stores.pending(), (old) => {
        if (old === undefined) return old;
        return old.filter((store) => store.id !== storeId);
      });

      return { previousQueue };
    },

    onError: (error: Error, storeId: string, context: MutateContext | undefined) => {
      if (context?.previousQueue !== undefined) {
        queryClient.setQueryData(queryKeys.stores.pending(), context.previousQueue);
      }

      logger.error("useApproveStoreMutation: approve failed", {
        storeId,
        error: error.message,
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stores.pending() });
    },
  });
}
