"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";
import { REALTIME_CHANNELS } from "@/shared/constants/realtime";
import { logger } from "@/shared/utils/logger";
import type { OrderStatus } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";

export interface UseStoreOrdersQueryInput {
  readonly storeId: string | null;
  readonly status?: OrderStatus;
}

function sortByCreatedAtDesc(orders: readonly Order[]): readonly Order[] {
  return orders.toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function useStoreOrdersQuery({ storeId, status }: UseStoreOrdersQueryInput) {
  const queryKey = storeId ? queryKeys.orders.byStore(storeId) : queryKeys.orders.all();

  useRealtimeInvalidation({ channel: REALTIME_CHANNELS.ORDERS, queryKey });

  return useQuery({
    queryKey,
    enabled: storeId !== null,
    queryFn: async () => {
      try {
        const url = new URL("/api/store/orders", window.location.origin);
        if (status !== undefined) url.searchParams.set("status", status);
        const res = await fetch(url.toString(), { credentials: "include" });
        if (res.status === 401) return [];
        if (!res.ok) throw new Error(`store/orders: ${res.status}`);
        const json = (await res.json()) as { data: readonly Order[] };
        return sortByCreatedAtDesc(json.data);
      } catch (err) {
        logger.error("useStoreOrdersQuery: fetch failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
  });
}
