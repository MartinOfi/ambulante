import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { storeValidationService } from "@/features/store-validation/services";
import type {
  PendingStore,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

export function useStoresByStatusQuery(status: ValidationStatus) {
  return useQuery<readonly PendingStore[]>({
    queryKey: queryKeys.stores.byStatus(status),
    queryFn: () => storeValidationService.getStoresByStatus(status),
    staleTime: 30_000,
  });
}
