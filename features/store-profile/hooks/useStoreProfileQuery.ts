import { useQuery } from "@tanstack/react-query";
import { storeProfileService } from "@/features/store-profile/services";
import { storeProfileSchema } from "@/features/store-profile/schemas/store-profile.schemas";
import { parseResponse } from "@/shared/query/parseResponse";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";

export function useStoreProfileQuery(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.stores.profile(storeId ?? ""),
    queryFn: async () => {
      if (storeId === null || storeId.length === 0) {
        throw new Error("storeId is required");
      }
      try {
        return await parseResponse(storeProfileSchema, storeProfileService.getProfile(storeId));
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
