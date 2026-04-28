"use client";

import { REALTIME_CHANNELS } from "@/shared/constants/realtime";
import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";

export function useOrderRealtime(orderId: string): void {
  useRealtimeInvalidation({
    channel: REALTIME_CHANNELS.ORDERS,
    queryKey: queryKeys.orders.byId(orderId),
  });
}
