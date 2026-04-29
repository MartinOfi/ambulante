import { useQuery } from "@tanstack/react-query";

import { STORAGE_BUCKETS } from "@/shared/constants/storage";
import { queryKeys } from "@/shared/query/keys";
import { storageService } from "@/shared/services";
import {
  VALIDATION_DOC_SIGNED_URL_EXPIRES_IN_S,
  VALIDATION_DOC_STALE_TIME_MS,
} from "@/features/store-validation/constants";
import { storeValidationService } from "@/features/store-validation/services";
import type { ValidationDocType } from "@/features/store-validation/types/store-validation.types";

export interface ValidationDocResult {
  readonly url: string;
  readonly mimeType: string;
  readonly filename: string;
}

async function fetchValidationDoc(
  storeId: string,
  docType: ValidationDocType,
): Promise<ValidationDocResult | null> {
  const meta = await storeValidationService.getValidationDoc({ storeId, docType });
  if (meta === null) return null;

  const result = await storageService.getSignedUrl({
    bucket: STORAGE_BUCKETS.VALIDATION_DOCS,
    path: meta.path,
    expiresIn: VALIDATION_DOC_SIGNED_URL_EXPIRES_IN_S,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    url: result.data,
    mimeType: meta.mimeType,
    filename: meta.filename,
  };
}

export function useValidationDoc(storeId: string, docType: ValidationDocType) {
  return useQuery<ValidationDocResult | null>({
    queryKey: queryKeys.stores.validationDoc(storeId, docType),
    queryFn: () => fetchValidationDoc(storeId, docType),
    staleTime: VALIDATION_DOC_STALE_TIME_MS,
    retry: false,
  });
}
