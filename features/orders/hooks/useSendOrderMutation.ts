import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { ordersService } from "@/features/orders/services/orders.mock";
import type { SendOrderInput } from "@/features/orders/services/orders.service";

export function useSendOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendOrderInput) => ordersService.send(input),

    onError: (error: unknown) => {
      logger.error("useSendOrderMutation: send failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
}
