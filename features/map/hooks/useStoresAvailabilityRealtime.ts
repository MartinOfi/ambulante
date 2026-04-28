"use client";

import { REALTIME_CHANNELS } from "@/shared/constants/realtime";
import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";

export function useStoresAvailabilityRealtime(): void {
  useRealtimeInvalidation({
    channel: REALTIME_CHANNELS.STORES,
    queryKey: queryKeys.stores.all(),
  });
}
