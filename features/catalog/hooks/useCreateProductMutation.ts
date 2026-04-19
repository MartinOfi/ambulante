import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { catalogService } from "@/features/catalog/services/catalog.mock";
import type { CreateProductValues } from "@/features/catalog/schemas/catalog.schemas";
import type { Product } from "@/shared/schemas/product";

interface CreateProductInput {
  storeId: string;
  values: CreateProductValues;
}

interface MutationContext {
  previousProducts: readonly Product[] | undefined;
  storeId: string;
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductInput, MutationContext>({
    mutationFn: ({ storeId, values }) => catalogService.create(storeId, values),

    onMutate: async ({ storeId, values }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.catalog.byStore(storeId) });

      const previousProducts = queryClient.getQueryData<readonly Product[]>(
        queryKeys.catalog.byStore(storeId),
      );

      const optimisticProduct: Product = {
        id: `optimistic-${crypto.randomUUID()}`,
        storeId,
        name: values.name,
        description: values.description,
        priceArs: values.priceArs,
        photoUrl: values.photoUrl || undefined,
        isAvailable: values.isAvailable,
      };

      queryClient.setQueryData<readonly Product[]>(queryKeys.catalog.byStore(storeId), (prev) => [
        ...(prev ?? []),
        optimisticProduct,
      ]);

      return { previousProducts, storeId };
    },

    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          queryKeys.catalog.byStore(context.storeId),
          context.previousProducts,
        );
      }

      logger.error("useCreateProductMutation: create failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.byStore(variables.storeId) });
    },
  });
}
