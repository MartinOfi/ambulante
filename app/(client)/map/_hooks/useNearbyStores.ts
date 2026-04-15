"use client";

import { useMemo } from "react";
import { MOCK_STORES } from "@/lib/mock/stores";
import type { Store } from "../_types/store";
import type { RadiusValue } from "@/lib/constants/radius";

export function useNearbyStores(radius: RadiusValue): {
  stores: Store[];
  total: number;
} {
  const stores = useMemo(
    () =>
      MOCK_STORES.filter((s) => s.distanceMeters <= radius).sort(
        (a, b) => a.distanceMeters - b.distanceMeters,
      ),
    [radius],
  );

  return { stores, total: stores.length };
}
