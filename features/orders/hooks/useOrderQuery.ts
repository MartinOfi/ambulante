import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { Order } from "@/shared/schemas/order";
import { ordersService } from "@/features/orders/services";

export function useOrderQuery(orderId: string) {
  return useQuery<Order | null>({
    queryKey: queryKeys.orders.byId(orderId),
    queryFn: () => ordersService.getById(orderId),
    staleTime: 30_000,
  });
}
