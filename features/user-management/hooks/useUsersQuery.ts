"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { getUserManagementService } from "@/features/user-management/services/userManagement.factory";
import { USERS_PAGE_SIZE } from "@/features/user-management/constants";
import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";

export interface UseUsersQueryInput {
  readonly role?: UserRole;
  readonly status?: SuspensionStatus;
  readonly page?: number;
}

export function useUsersQuery({ role, status, page = 1 }: UseUsersQueryInput = {}) {
  const offset = (page - 1) * USERS_PAGE_SIZE;
  return useQuery({
    queryKey: [...queryKeys.users.all(), { role, status, page }] as const,
    queryFn: () =>
      getUserManagementService().listUsers({
        role,
        status,
        limit: USERS_PAGE_SIZE,
        offset,
      }),
  });
}
