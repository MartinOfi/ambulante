import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { Order } from "@/shared/schemas/order";
import { orderRepository } from "@/shared/repositories";

export function useOrderQuery(orderId: string) {
  return useQuery<Order | null>({
    queryKey: queryKeys.orders.byId(orderId),
    queryFn: () => orderRepository.findById(orderId),
    staleTime: 30_000,
  });
}
