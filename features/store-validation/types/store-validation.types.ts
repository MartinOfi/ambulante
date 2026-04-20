import type { Store } from "@/shared/types/store";
import type { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";

export type ValidationStatus =
  (typeof STORE_VALIDATION_STATUS)[keyof typeof STORE_VALIDATION_STATUS];

export interface PendingStore extends Store {
  readonly validationStatus: ValidationStatus;
  readonly rejectionReason?: string;
}

export interface RejectStoreInput {
  readonly storeId: string;
  readonly reason: string;
}
