"use client";

import { useCallback, useEffect, useState } from "react";

import { storesService } from "@/shared/services/stores";
import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { useAvailabilityStore } from "@/features/store-shell/stores/availability.store";

export interface UseAvailabilityReturn {
  readonly isAvailable: boolean;
  readonly isPending: boolean;
  readonly toggle: () => void;
  readonly setAvailable: (value: boolean) => void;
}

export function useAvailability(): UseAvailabilityReturn {
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? null;
  const serverStatus = storeQuery.data?.status ?? null;

  const isAvailable = useAvailabilityStore((s) => s.isAvailable);
  const setAvailable = useAvailabilityStore((s) => s.setAvailable);

  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (serverStatus !== null) {
      setAvailable(serverStatus === "open");
    }
  }, [serverStatus, setAvailable]);

  const toggle = useCallback(() => {
    if (!storeId || isPending) return;
    const next = !isAvailable;
    setAvailable(next);
    setIsPending(true);
    storesService
      .updateAvailability(storeId, next)
      .catch(() => {
        setAvailable(!next);
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [storeId, isAvailable, isPending, setAvailable]);

  return { isAvailable, isPending, toggle, setAvailable };
}
