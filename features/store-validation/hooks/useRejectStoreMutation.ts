import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import type {
  PendingStore,
  RejectStoreInput,
} from "@/features/store-validation/types/store-validation.types";

interface MutateContext {
  readonly previousQueue: readonly PendingStore[] | undefined;
}

export function useRejectStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation<PendingStore, Error, RejectStoreInput, MutateContext>({
    mutationFn: (input: RejectStoreInput) => storeValidationService.rejectStore(input),

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
