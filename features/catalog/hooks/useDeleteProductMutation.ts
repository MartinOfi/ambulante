import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { catalogService } from "@/features/catalog/services/catalog.mock";
import type { Product } from "@/shared/schemas/product";

interface DeleteProductInput {
  storeId: string;
  productId: string;
}

interface MutationContext {
  previousProducts: readonly Product[] | undefined;
  storeId: string;
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteProductInput, MutationContext>({
    mutationFn: ({ storeId, productId }) => catalogService.delete(storeId, productId),

    onMutate: async ({ storeId, productId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.catalog.byStore(storeId) });

      const previousProducts = queryClient.getQueryData<readonly Product[]>(
        queryKeys.catalog.byStore(storeId),
      );

      queryClient.setQueryData<readonly Product[]>(queryKeys.catalog.byStore(storeId), (prev) =>
        prev?.filter((product) => product.id !== productId),
      );

      return { previousProducts, storeId };
    },

    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          queryKeys.catalog.byStore(context.storeId),
          context.previousProducts,
        );
      }

      logger.error("useDeleteProductMutation: delete failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.byStore(variables.storeId) });
    },
  });
}
