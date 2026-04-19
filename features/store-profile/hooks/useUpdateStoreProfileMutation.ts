import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storeProfileService } from "@/features/store-profile/services/store-profile.mock";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";

export function useUpdateStoreProfileMutation(storeId: string) {
  const queryClient = useQueryClient();
  const profileKey = queryKeys.stores.profile(storeId);

  return useMutation({
    mutationFn: (input: UpdateStoreProfileInput) =>
      storeProfileService.updateProfile(storeId, input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const snapshot = queryClient.getQueryData<StoreProfile>(profileKey);

      if (snapshot !== undefined) {
        queryClient.setQueryData<StoreProfile>(profileKey, {
          ...snapshot,
          ...input,
        });
      }

      return { snapshot };
    },

    onError: (error, _input, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(profileKey, context.snapshot);
      }
      logger.error("useUpdateStoreProfileMutation: update failed", {
        storeId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });
}
