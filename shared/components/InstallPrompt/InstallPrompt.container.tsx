"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/shared/utils/logger";
import { InstallPrompt } from "./InstallPrompt";
import {
  INSTALL_PLATFORM,
  type InstallPlatform,
  type BeforeInstallPromptEvent,
} from "./InstallPrompt.types";

const DISMISSED_STORAGE_KEY = "ambulante-install-prompt-dismissed";
const DISMISSED_STORAGE_VALUE = "true" as const;

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return INSTALL_PLATFORM.unknown;

  const userAgent = navigator.userAgent;
  const userAgentLower = userAgent.toLowerCase();

  // iPadOS reports "MacIntel" platform but has touch points
  const isIos =
    /iphone|ipad|ipod/i.test(userAgentLower) ||
    (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);

  if (isIos) return INSTALL_PLATFORM.ios;

  const isAndroid = /android/i.test(userAgentLower);
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

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISMISSED_STORAGE_KEY) === DISMISSED_STORAGE_VALUE;
}

function writeDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISSED_STORAGE_KEY, DISMISSED_STORAGE_VALUE);
}

export function InstallPromptContainer() {
  const [platform, setPlatform] = useState<InstallPlatform>(INSTALL_PLATFORM.unknown);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [canTriggerNativePrompt, setCanTriggerNativePrompt] = useState(false);

  // Persisted ref — no re-render needed when the event is captured
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsInstalled(isInStandaloneMode());
    setIsDismissed(readDismissed());

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

  // Move focus into the dialog when it first appears for screen reader accessibility
  useEffect(() => {
    if (!isDismissed && platform !== INSTALL_PLATFORM.unknown && !isInstalled) {
      dialogRef.current?.focus();
    }
  }, [isDismissed, platform, isInstalled]);

  const handleTriggerNativePrompt = useCallback(async () => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return;

    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      logger.info("install prompt outcome", { outcome });
      deferredPromptRef.current = null;
      setCanTriggerNativePrompt(false);
      // User dismissed the native prompt — hide our banner too
      if (outcome === "dismissed") {
        writeDismissed();
        setIsDismissed(true);
      }
    } catch (error) {
      logger.error("failed to trigger install prompt", { error });
      setCanTriggerNativePrompt(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    writeDismissed();
    setIsDismissed(true);
  }, []);

  if (isDismissed) return null;

  return (
    <InstallPrompt
      dialogRef={dialogRef}
      platform={platform}
      isInstalled={isInstalled}
      canTriggerNativePrompt={canTriggerNativePrompt}
      onTriggerNativePrompt={handleTriggerNativePrompt}
      onDismiss={handleDismiss}
    />
  );
}
