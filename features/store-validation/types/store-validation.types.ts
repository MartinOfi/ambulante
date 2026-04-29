import type { Store } from "@/shared/types/store";
import type {
  STORE_VALIDATION_STATUS,
  VALIDATION_DOC_TYPES,
} from "@/features/store-validation/constants";

export type ValidationStatus =
  (typeof STORE_VALIDATION_STATUS)[keyof typeof STORE_VALIDATION_STATUS];

export type ValidationDocType = (typeof VALIDATION_DOC_TYPES)[keyof typeof VALIDATION_DOC_TYPES];

export interface ValidationDocMeta {
  readonly path: string;
  readonly mimeType: string;
  readonly filename: string;
}

export type ValidationDocs = Partial<Record<ValidationDocType, ValidationDocMeta>>;

export interface PendingStore extends Store {
  readonly validationStatus: ValidationStatus;
  readonly rejectionReason?: string;
  readonly documents?: ValidationDocs;
}

export interface RejectStoreInput {
  readonly storeId: string;
  readonly reason: string;
}

export interface GetValidationDocInput {
  readonly storeId: string;
  readonly docType: ValidationDocType;
}
