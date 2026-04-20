"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import type { UserManagementService } from "@/features/user-management/services/userManagement.service";
import type { UserRole } from "@/shared/schemas/user";

export interface UseUsersQueryInput {
  readonly service: UserManagementService;
  readonly role?: UserRole;
}

export function useUsersQuery({ service, role }: UseUsersQueryInput) {
  return useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => service.listUsers({ role }),
  });
}
