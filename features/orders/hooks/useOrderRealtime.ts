"use client";

import { queryKeys } from "@/shared/query/keys";
import { useTableChangesInvalidation } from "@/shared/query/useTableChangesInvalidation";

export function useOrderRealtime(orderId: string): void {
  useTableChangesInvalidation({
    table: "orders",
    filter: `public_id=eq.${orderId}`,
    queryKey: queryKeys.orders.byId(orderId),
  });
}
