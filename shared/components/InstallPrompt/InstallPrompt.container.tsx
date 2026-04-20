"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/shared/utils/logger";
import { InstallPrompt } from "./InstallPrompt";
import {
  INSTALL_PLATFORM,
  type InstallPlatform,
  type BeforeInstallPromptEvent,
} from "./InstallPrompt.types";

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return INSTALL_PLATFORM.unknown;

  const userAgent = navigator.userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) return INSTALL_PLATFORM.ios;

  const isAndroid = /android/.test(userAgent);
  if (isAndroid) return INSTALL_PLATFORM.android;

  return INSTALL_PLATFORM.unknown;
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error — navigator.standalone is iOS Safari non-standard property
    navigator.standalone === true
  );
}

const DISMISSED_STORAGE_KEY = "ambulante-install-prompt-dismissed";

export function InstallPromptContainer() {
  const [platform, setPlatform] = useState<InstallPlatform>(INSTALL_PLATFORM.unknown);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [canTriggerNativePrompt, setCanTriggerNativePrompt] = useState(false);

  // Persisted ref — no re-render needed when the event is captured
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    setIsInstalled(isInStandaloneMode());

    const dismissed = localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
    setIsDismissed(dismissed);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanTriggerNativePrompt(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleTriggerNativePrompt = useCallback(async () => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return;

    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      logger.info("install prompt outcome", { outcome });
      deferredPromptRef.current = null;
      setCanTriggerNativePrompt(false);
    } catch (error) {
      logger.error("failed to trigger install prompt", { error });
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setIsDismissed(true);
  }, []);

  if (isDismissed) return null;

  return (
    <InstallPrompt
      platform={platform}
      isInstalled={isInstalled}
      canTriggerNativePrompt={canTriggerNativePrompt}
      onTriggerNativePrompt={handleTriggerNativePrompt}
      onDismiss={handleDismiss}
    />
  );
}
