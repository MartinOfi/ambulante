"use client";

import { useEffect, useState } from "react";
import type { Coordinates, Store } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";
import { storesService } from "@/shared/services/stores";

export interface UseNearbyStoresResult {
  readonly stores: readonly Store[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export interface UseNearbyStoresInput {
  readonly coords: Coordinates | null;
  readonly radius: RadiusValue;
}

export function useNearbyStores({
  coords,
  radius,
}: UseNearbyStoresInput): UseNearbyStoresResult {
  const [stores, setStores] = useState<readonly Store[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) {
      setStores([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    storesService
      .findNearby({ coords, radiusMeters: radius })
      .then((result) => {
        if (cancelled) return;
        setStores(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Error cargando tiendas";
        setError(message);
        setStores([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coords, radius]);

  return { stores, total: stores.length, isLoading, error };
}
