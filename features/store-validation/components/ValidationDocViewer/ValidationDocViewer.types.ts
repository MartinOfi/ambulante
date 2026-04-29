import type { ValidationDocType } from "@/features/store-validation/types/store-validation.types";

export interface ValidationDocViewerProps {
  readonly docType: ValidationDocType;
  readonly label: string;
  readonly url: string | null;
  readonly mimeType: string | null;
  readonly filename: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export interface ValidationDocViewerContainerProps {
  readonly storeId: string;
  readonly docType: ValidationDocType;
  readonly label: string;
}
