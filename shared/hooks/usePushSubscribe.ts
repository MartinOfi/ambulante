"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { pushService } from "@/shared/services";
import { logger } from "@/shared/utils/logger";
import type { PushPermissionStatus } from "@/shared/services/push.types";

export interface UsePushSubscribeReturn {
  readonly permission: PushPermissionStatus;
  readonly isSubscribed: boolean;
  readonly isPending: boolean;
  readonly isSupported: boolean;
  readonly subscribe: () => void;
  readonly unsubscribe: () => void;
}

export function usePushSubscribe(): UsePushSubscribeReturn {
  const [permission, setPermission] = useState<PushPermissionStatus>("unavailable");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  // El permiso del browser puede cambiar fuera de la app (ajustes del usuario).
  // Refrescamos al montar y cuando la pestaña vuelve a estar visible.
  useEffect(() => {
    function refreshPermission() {
      setPermission(pushService.getPermissionStatus());
    }
    refreshPermission();
    document.addEventListener("visibilitychange", refreshPermission);
    return () => document.removeEventListener("visibilitychange", refreshPermission);
  }, []);

  // Inicializar isSubscribed leyendo el estado actual de la suscripción del
  // browser (no destructivo). Sin esto, el toggle siempre arrancaría en OFF
  // aunque el usuario tenga ya una suscripción activa, generando UX errónea
  // y riesgo de doble-suscripción al re-suscribir desde el wizard.
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      try {
        const current = await pushService.getActiveSubscription();
        if (!cancelled) setIsSubscribed(current !== null);
      } catch (error) {
        logger.error("usePushSubscribe.getActiveSubscription failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(() => {
    startTransition(async () => {
      try {
        const subscription = await pushService.subscribe();
        setPermission(pushService.getPermissionStatus());
        setIsSubscribed(subscription !== null);
      } catch (error) {
        logger.error("usePushSubscribe.subscribe failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setIsSubscribed(false);
      }
    });
  }, [startTransition]);

  const unsubscribe = useCallback(() => {
    startTransition(async () => {
      try {
        const ok = await pushService.unsubscribe();
        if (ok) setIsSubscribed(false);
      } catch (error) {
        logger.error("usePushSubscribe.unsubscribe failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, [startTransition]);

  return {
    permission,
    isSubscribed,
    isPending,
    isSupported: permission !== "unavailable",
    subscribe,
    unsubscribe,
  };
}
