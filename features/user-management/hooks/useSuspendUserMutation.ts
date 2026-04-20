"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { extractErrorMessage } from "@/shared/utils/errorMessage";
import { logger } from "@/shared/utils/logger";
import type { UserManagementService } from "@/features/user-management/services/userManagement.service";

export interface UseSuspendUserMutationInput {
  readonly service: UserManagementService;
  readonly onSuccess?: () => void;
  readonly onError?: (message: string) => void;
}

export function useSuspendUserMutation({
  service,
  onSuccess,
  onError,
}: UseSuspendUserMutationInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => service.suspendUser({ userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      logger.error("useSuspendUserMutation: error suspending user", { error });
      const message = extractErrorMessage(error) ?? "No se pudo suspender el usuario";
      onError?.(message);
    },
  });
}
