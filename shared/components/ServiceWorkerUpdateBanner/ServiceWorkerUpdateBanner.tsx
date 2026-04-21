"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import type { ServiceWorkerUpdateBannerProps } from "./ServiceWorkerUpdateBanner.types";

export function ServiceWorkerUpdateBanner({ onApply, onDismiss }: ServiceWorkerUpdateBannerProps) {
  const t = useTranslations("ServiceWorker");

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3 shadow-lg shadow-brand/20 backdrop-blur-md"
    >
      <p className="text-sm font-medium text-foreground">{t("updateAvailable")}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-7 px-3 text-xs text-muted hover:text-foreground"
        >
          {t("later")}
        </Button>
        <Button
          size="sm"
          onClick={onApply}
          className="h-7 bg-brand px-3 text-xs text-white hover:bg-brand/90"
        >
          {t("update")}
        </Button>
      </div>
    </div>
  );
}
