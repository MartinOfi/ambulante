import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { catalogService } from "@/features/catalog/services/catalog.mock";
import type { EditProductValues } from "@/features/catalog/schemas/catalog.schemas";
import type { Product } from "@/shared/schemas/product";

interface UpdateProductInput {
  storeId: string;
  productId: string;
  values: EditProductValues;
}

interface MutationContext {
  previousProducts: readonly Product[] | undefined;
  previousProduct: Product | null | undefined;
  storeId: string;
  productId: string;
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, UpdateProductInput, MutationContext>({
    mutationFn: ({ storeId, productId, values }) =>
      catalogService.update(storeId, productId, values),

    onMutate: async ({ storeId, productId, values }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.catalog.byStore(storeId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.catalog.byId(productId) });

      const previousProducts = queryClient.getQueryData<readonly Product[]>(
        queryKeys.catalog.byStore(storeId),
      );
      const previousProduct = queryClient.getQueryData<Product | null>(
        queryKeys.catalog.byId(productId),
      );

      queryClient.setQueryData<readonly Product[]>(queryKeys.catalog.byStore(storeId), (prev) =>
        prev?.map((product) => (product.id === productId ? { ...product, ...values } : product)),
      );

      return { previousProducts, previousProduct, storeId, productId };
    },

    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(
          queryKeys.catalog.byStore(context.storeId),
          context.previousProducts,
        );
        queryClient.setQueryData(
          queryKeys.catalog.byId(context.productId),
          context.previousProduct,
        );
      }

      logger.error("useUpdateProductMutation: update failed", {
        productId: variables.productId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.byStore(variables.storeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.byId(variables.productId) });
    },
  });
}
