"use client";

import { useCallback, useEffect, useState } from "react";

import { pushService } from "@/shared/services";
import { logger } from "@/shared/utils/logger";
import type { PushPermissionStatus } from "@/shared/services/push.types";

export interface UsePushSubscribeReturn {
  readonly permission: PushPermissionStatus;
  readonly isSubscribed: boolean;
  readonly isPending: boolean;
  readonly isSupported: boolean;
  readonly subscribe: () => Promise<void>;
  readonly unsubscribe: () => Promise<void>;
}

export function usePushSubscribe(): UsePushSubscribeReturn {
  const [permission, setPermission] = useState<PushPermissionStatus>(() =>
    pushService.getPermissionStatus(),
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // El permiso del browser puede cambiar fuera de la app (ajustes del usuario).
  // Refrescamos al montar y cuando la pestaña vuelve a estar visible.
  useEffect(() => {
    function refresh() {
      setPermission(pushService.getPermissionStatus());
    }
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const subscribe = useCallback(async () => {
    setIsPending(true);
    try {
      const subscription = await pushService.subscribe();
      setPermission(pushService.getPermissionStatus());
      setIsSubscribed(subscription !== null);
    } catch (error) {
      logger.error("usePushSubscribe.subscribe failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setIsSubscribed(false);
    } finally {
      setIsPending(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsPending(true);
    try {
      const ok = await pushService.unsubscribe();
      if (ok) setIsSubscribed(false);
    } catch (error) {
      logger.error("usePushSubscribe.unsubscribe failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isPending,
    isSupported: permission !== "unavailable",
    subscribe,
    unsubscribe,
  };
}
