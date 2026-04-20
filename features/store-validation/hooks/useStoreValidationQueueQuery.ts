import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { storeValidationService } from "@/features/store-validation/services/store-validation.service.mock";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

export function useStoreValidationQueueQuery() {
  return useQuery<readonly PendingStore[]>({
    queryKey: queryKeys.stores.pending(),
    queryFn: () => storeValidationService.getPendingStores(),
    staleTime: 30_000,
  });
}
