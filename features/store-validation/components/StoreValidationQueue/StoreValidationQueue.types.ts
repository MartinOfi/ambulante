import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

export interface StoreValidationQueueProps {
  readonly stores: readonly PendingStore[];
  readonly isLoading: boolean;
  readonly onSelectStore: (storeId: string) => void;
}
