"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { useSession } from "@/shared/hooks/useSession";
import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";
import {
  GEO_MAX_AGE_MS,
  GEO_TIMEOUT_MS,
  MIN_ACCURACY_METERS,
  POOR_ACCURACY_FACTOR,
  STORE_LOCATION_REFRESH_MS,
  STORE_LOCATION_STALE_MS,
} from "@/shared/constants/geo";

export type LocationPublishingStatus = "idle" | "publishing" | "stale" | "error";

export interface UseLocationPublishingReturn {
  readonly locationStatus: LocationPublishingStatus;
}

export function useLocationPublishing(): UseLocationPublishingReturn {
  const { isAvailable } = useAvailability();
  const sessionResult = useSession();
  const userId = sessionResult.status === "authenticated" ? sessionResult.session.user.id : null;

  const [locationStatus, setLocationStatus] = useState<LocationPublishingStatus>("idle");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (staleTimerRef.current !== null) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  }, []);

  const resetStaleTimer = useCallback(() => {
    if (staleTimerRef.current !== null) clearTimeout(staleTimerRef.current);
    staleTimerRef.current = setTimeout(() => {
      setLocationStatus("stale");
    }, STORE_LOCATION_STALE_MS);
  }, []);

  const publishOnce = useCallback(
    (storeId: string) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos.coords.accuracy > MIN_ACCURACY_METERS * POOR_ACCURACY_FACTOR) {
            setLocationStatus("error");
            return;
          }
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          void storesService
            .updateLocation(storeId, coords)
            .then(() => {
              setLocationStatus("publishing");
              resetStaleTimer();
            })
            .catch((err: unknown) => {
              logger.error("useLocationPublishing: updateLocation failed", {
                storeId,
                error: err instanceof Error ? err.message : String(err),
              });
              setLocationStatus("error");
            });
        },
        (geoErr: GeolocationPositionError) => {
          logger.warn("useLocationPublishing: geolocation failed", {
            code: geoErr.code,
            message: geoErr.message,
          });
          setLocationStatus("error");
        },
        { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS },
      );
    },
    [resetStaleTimer],
  );

  useEffect(() => {
    if (!isAvailable || !userId) {
      clearTimers();
      setLocationStatus("idle");
      return;
    }

    let active = true;

    void storesService.findByOwnerId(userId).then((store) => {
      if (!active || !store) return;
      publishOnce(store.id);
      intervalRef.current = setInterval(() => publishOnce(store.id), STORE_LOCATION_REFRESH_MS);
    });

    return () => {
      active = false;
      clearTimers();
    };
  }, [isAvailable, userId, publishOnce, clearTimers]);

  return { locationStatus };
}
