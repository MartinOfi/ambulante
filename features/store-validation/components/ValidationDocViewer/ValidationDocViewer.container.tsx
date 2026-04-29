"use client";

import { useValidationDoc } from "@/features/store-validation/hooks/useValidationDoc";
import { ValidationDocViewer } from "./ValidationDocViewer";
import type { ValidationDocViewerContainerProps } from "./ValidationDocViewer.types";

export function ValidationDocViewerContainer({
  storeId,
  docType,
  label,
}: ValidationDocViewerContainerProps) {
  const query = useValidationDoc(storeId, docType);

  const errorMessage = query.isError && query.error instanceof Error ? query.error.message : null;

  return (
    <ValidationDocViewer
      docType={docType}
      label={label}
      url={query.data?.url ?? null}
      mimeType={query.data?.mimeType ?? null}
      filename={query.data?.filename ?? null}
      isLoading={query.isLoading}
      errorMessage={errorMessage}
    />
  );
}
