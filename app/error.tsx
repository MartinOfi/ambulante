"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { logger } from "@/shared/utils/logger";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

function isChunkError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    error.name === "ChunkLoadError" ||
    msg.includes("loading chunk") ||
    msg.includes("cannot read properties of undefined (reading 'call')") ||
    msg.includes(".call is not a function")
  );
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  const t = useTranslations("Pages.Error");
  const chunkError = isChunkError(error);

  useEffect(() => {
    logger.error("Unhandled render error", {
      message: error.message,
      digest: error.digest,
      isChunkError: chunkError,
    });
  }, [error, chunkError]);

  if (chunkError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
          <RefreshCw className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{t("chunkTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("chunkDescription")}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          {t("chunkReload")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      <button
        onClick={reset}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        {t("retry")}
      </button>
    </div>
  );
}
