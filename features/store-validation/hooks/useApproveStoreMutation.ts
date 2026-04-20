import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

interface MutateContext {
  readonly previousQueue: readonly PendingStore[] | undefined;
}

export function useApproveStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation<PendingStore, Error, string, MutateContext>({
    mutationFn: (storeId: string) => storeValidationService.approveStore(storeId),

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
