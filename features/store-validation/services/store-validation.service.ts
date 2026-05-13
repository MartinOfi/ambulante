import type {
  GetValidationDocInput,
  PendingStore,
  RejectStoreInput,
  ValidationDocMeta,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

export interface StoreValidationService {
  getPendingStores(): Promise<readonly PendingStore[]>;
  getStoresByStatus(status: ValidationStatus): Promise<readonly PendingStore[]>;
  getStoreById(id: string): Promise<PendingStore | null>;
  approveStore(storeId: string): Promise<PendingStore>;
  rejectStore(input: RejectStoreInput): Promise<PendingStore>;
  getValidationDoc(input: GetValidationDocInput): Promise<ValidationDocMeta | null>;
}
