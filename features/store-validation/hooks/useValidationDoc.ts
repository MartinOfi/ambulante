import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { VALIDATION_DOC_STALE_TIME_MS } from "@/features/store-validation/constants";
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
  const url = `/api/admin/stores/${encodeURIComponent(storeId)}/validation-doc?docType=${encodeURIComponent(docType)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Error obteniendo documento.");
  }
  const body = (await res.json()) as { data: ValidationDocResult | null };
  return body.data;
}

export function useValidationDoc(storeId: string, docType: ValidationDocType) {
  return useQuery<ValidationDocResult | null>({
    queryKey: queryKeys.stores.validationDoc(storeId, docType),
    queryFn: () => fetchValidationDoc(storeId, docType),
    staleTime: VALIDATION_DOC_STALE_TIME_MS,
    retry: false,
  });
}
