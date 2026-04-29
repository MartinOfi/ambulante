"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { getUserManagementService } from "@/features/user-management/services/userManagement.factory";

export interface UseUserDetailQueryInput {
  readonly userId: string;
  readonly enabled?: boolean;
}

export function useUserDetailQuery({ userId, enabled = true }: UseUserDetailQueryInput) {
  return useQuery({
    queryKey: queryKeys.users.byId(userId),
    queryFn: () => getUserManagementService().getUserDetail({ userId }),
    enabled: enabled && userId.length > 0,
  });
}
