"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { getUserManagementService } from "@/features/user-management/services/userManagement.factory";
import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";

export interface UseUsersQueryInput {
  readonly role?: UserRole;
  readonly status?: SuspensionStatus;
}

export function useUsersQuery({ role, status }: UseUsersQueryInput = {}) {
  return useQuery({
    queryKey: [...queryKeys.users.all(), { role, status }] as const,
    queryFn: () => getUserManagementService().listUsers({ role, status }),
  });
}
