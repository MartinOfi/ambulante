"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { logger } from "@/shared/utils/logger";
import { reactivateUserAction } from "@/features/user-management/server-actions/user-management-actions";

export interface UseReactivateUserMutationInput {
  readonly onSuccess?: () => void;
  readonly onError?: (message: string) => void;
}

const FALLBACK_MESSAGE = "No se pudo reactivar el usuario";

export function useReactivateUserMutation({ onSuccess, onError }: UseReactivateUserMutationInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await reactivateUserAction({ userId });
      if (result.ok === false) throw new Error(result.error);
      return result;
    },
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.byId(userId) });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      logger.error("useReactivateUserMutation: error reactivating user", { error });
      const message = error instanceof Error && error.message.length > 0 ? error.message : FALLBACK_MESSAGE;
      onError?.(message);
    },
  });
}
