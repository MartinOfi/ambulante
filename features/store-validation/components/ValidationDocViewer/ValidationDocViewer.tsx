import Image from "next/image";

import { VALIDATION_DOC_MIME_TYPE_PDF } from "@/features/store-validation/constants";
import type { ValidationDocViewerProps } from "./ValidationDocViewer.types";

export function ValidationDocViewer({
  docType,
  label,
  url,
  mimeType,
  filename,
  isLoading,
  errorMessage,
}: ValidationDocViewerProps) {
  return (
    <section
      data-testid={`validation-doc-${docType}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{label}</h3>
        {filename !== null ? (
          <span className="truncate text-xs text-zinc-500" title={filename}>
            {filename}
          </span>
        ) : null}
      </header>

      <ValidationDocBody
        docType={docType}
        label={label}
        url={url}
        mimeType={mimeType}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    </section>
  );
}

interface ValidationDocBodyProps {
  readonly docType: string;
  readonly label: string;
  readonly url: string | null;
  readonly mimeType: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

function ValidationDocBody({
  docType,
  label,
  url,
  mimeType,
  isLoading,
  errorMessage,
}: ValidationDocBodyProps) {
  if (isLoading) {
    return (
      <div
        data-testid={`validation-doc-${docType}-loading`}
        className="h-40 w-full animate-pulse rounded-md bg-zinc-100"
      />
    );
  }

  if (errorMessage !== null) {
    return (
      <p
        data-testid={`validation-doc-${docType}-error`}
        className="text-sm text-red-600"
        role="alert"
      >
        No se pudo cargar el documento: {errorMessage}
      </p>
    );
  }

  if (url === null) {
    return (
      <p data-testid={`validation-doc-${docType}-empty`} className="text-sm italic text-zinc-500">
        La tienda aún no subió este documento.
      </p>
    );
  }

  // Defensive: the hook always returns url+mimeType together, but the dumb's
  // prop contract allows the combo (url, mimeType=null) — treat it as malformed.
  if (mimeType === null) {
    return (
      <p
        data-testid={`validation-doc-${docType}-error`}
        className="text-sm text-red-600"
        role="alert"
      >
        No se pudo determinar el tipo del documento.
      </p>
    );
  }

  if (mimeType === VALIDATION_DOC_MIME_TYPE_PDF) {
    return (
      <iframe
        data-testid={`validation-doc-${docType}-pdf`}
        src={url}
        title={label}
        className="h-96 w-full rounded-md border border-zinc-200"
      />
    );
  }

  return (
    <div
      data-testid={`validation-doc-${docType}-image`}
      className="relative h-96 w-full overflow-hidden rounded-md border border-zinc-200"
    >
      {/* unoptimized: signed URLs have short TTLs and the optimizer can break them. */}
      <Image src={url} alt={label} fill unoptimized className="object-contain" sizes="100vw" />
    </div>
  );
}
