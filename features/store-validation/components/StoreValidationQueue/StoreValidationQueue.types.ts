import type {
  PendingStore,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

export interface StoreValidationQueueProps {
  readonly stores: readonly PendingStore[];
  readonly isLoading: boolean;
  readonly activeStatus: ValidationStatus;
  readonly searchQuery: string;
  readonly onStatusChange: (status: ValidationStatus) => void;
  readonly onSearchChange: (query: string) => void;
}
