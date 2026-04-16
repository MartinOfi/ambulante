"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { storesService } from "@/shared/services/stores";
import { logger } from "@/shared/utils/logger";
import type { Coordinates } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";

export interface UseStoresNearbyQueryInput {
  readonly coords: Coordinates | null;
  readonly radius: RadiusValue;
}

export function useStoresNearbyQuery({ coords, radius }: UseStoresNearbyQueryInput) {
  const query = useQuery({
    queryKey: coords ? queryKeys.stores.nearby(coords, radius) : queryKeys.stores.all(),
    queryFn: async () => {
      if (!coords) throw new Error("coords required");
      const result = await storesService.findNearby({ coords, radiusMeters: radius });
      return result;
    },
    enabled: coords !== null,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useStoresNearbyQuery: fetch failed", {
        coords,
        radius,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, coords, radius]);

  return query;
}
