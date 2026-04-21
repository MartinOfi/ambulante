"use client";

import { useServiceWorkerUpdate } from "@/shared/hooks/useServiceWorkerUpdate";
import { useServiceWorkerControllerReload } from "@/shared/hooks/useServiceWorkerControllerReload";
import { SW_UPDATE_STATUS } from "@/shared/constants/service-worker";
import { ServiceWorkerUpdateBanner } from "./ServiceWorkerUpdateBanner";

export function ServiceWorkerUpdateBannerContainer() {
  const { status, applyUpdate, dismiss } = useServiceWorkerUpdate();
  useServiceWorkerControllerReload();

  if (status !== SW_UPDATE_STATUS.AVAILABLE) return null;

  return <ServiceWorkerUpdateBanner onApply={applyUpdate} onDismiss={dismiss} />;
}
