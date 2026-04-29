import { useInfiniteQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { orderRepository } from "@/shared/repositories";
import type { OrderHistoryPage } from "@/shared/repositories/order";
import type { OrderStatus } from "@/shared/constants/order";

const STATUS_QUERY_KEY_FALLBACK = "all";
const HISTORY_QUERY_KEY_SUFFIX = "history";

export interface UseOrderHistoryInput {
  readonly clientId: string | null;
  readonly status?: OrderStatus;
  readonly pageSize?: number;
}

export function useOrderHistory({ clientId, status, pageSize }: UseOrderHistoryInput) {
  return useInfiniteQuery({
    queryKey: clientId
      ? [
          ...queryKeys.orders.byUser(clientId),
          HISTORY_QUERY_KEY_SUFFIX,
          status ?? STATUS_QUERY_KEY_FALLBACK,
        ]
      : [HISTORY_QUERY_KEY_SUFFIX, "anonymous"],
    queryFn: ({ pageParam }: { pageParam: string | null }) => {
      if (clientId === null) {
        return Promise.resolve<OrderHistoryPage>({ orders: [], nextCursor: null });
      }
      return orderRepository.findByCustomer(clientId, {
        cursor: pageParam,
        limit: pageSize,
        status,
      });
    },
    initialPageParam: null as string | null,
    // null se trata como "no más páginas" en React Query v5; convertir a
    // undefined para que el segundo fetchNextPage no se confunda cuando
    // initialPageParam también es null.
    getNextPageParam: (lastPage: OrderHistoryPage) => lastPage.nextCursor ?? undefined,
    enabled: clientId !== null,
  });
}
