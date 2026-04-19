import { useQuery } from "@tanstack/react-query";
import { storeProfileService } from "@/features/store-profile/services/store-profile.mock";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";

export function useStoreProfileQuery(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.stores.profile(storeId ?? ""),
    queryFn: async () => {
      try {
        return await storeProfileService.getProfile(storeId!);
      } catch (error) {
        logger.error("useStoreProfileQuery: fetch failed", {
          storeId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: storeId !== null && storeId.length > 0,
  });
}
