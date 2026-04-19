import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { orderItemSchema } from "@/shared/schemas/order";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { ordersService } from "@/features/orders/services";
import type { SendOrderInput } from "@/features/orders/services/orders.service";

const sendOrderInputSchema = z.object({
  storeId: z.string().min(1, "El ID de tienda es obligatorio"),
  items: z.array(orderItemSchema).min(1, "El pedido debe tener al menos un ítem"),
  notes: z.string().optional(),
});

export function useSendOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendOrderInput) => {
      const validated = sendOrderInputSchema.parse(input);
      return ordersService.send(validated);
    },

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
