import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { submitOrder, type SubmitOrderInput } from "@/features/order-flow";

export interface SendOrderSuccess {
  readonly publicId: string;
  readonly status: "ENVIADO";
}

export function useSendOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitOrderInput): Promise<SendOrderSuccess> => {
      const result = await submitOrder(input);
      if (result.ok === false) throw new Error(result.message);
      return { publicId: result.publicId, status: result.status };
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
