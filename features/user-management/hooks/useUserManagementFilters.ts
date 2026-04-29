"use client";

import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useCallback } from "react";
import { USER_ROLES } from "@/shared/constants/user";
import { SUSPENSION_STATUS } from "@/shared/domain/user-suspension";
import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";
import type {
  RoleFilter,
  StatusFilter,
} from "@/features/user-management/components/UserFiltersBar";

const ROLE_VALUES: UserRole[] = [USER_ROLES.client, USER_ROLES.store, USER_ROLES.admin];
const STATUS_VALUES: SuspensionStatus[] = [SUSPENSION_STATUS.ACTIVE, SUSPENSION_STATUS.SUSPENDED];

export interface UserManagementFilters {
  readonly role: UserRole | null;
  readonly status: SuspensionStatus | null;
  readonly searchQuery: string;
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  readonly setRole: (role: RoleFilter) => void;
  readonly setStatus: (status: StatusFilter) => void;
  readonly setSearch: (query: string) => void;
}

export function useUserManagementFilters(): UserManagementFilters {
  const [role, setRoleParam] = useQueryState("role", parseAsStringEnum<UserRole>(ROLE_VALUES));
  const [status, setStatusParam] = useQueryState(
    "status",
    parseAsStringEnum<SuspensionStatus>(STATUS_VALUES),
  );
  const [search, setSearchParam] = useQueryState("q", parseAsString.withDefault(""));

  const setRole = useCallback(
    (next: RoleFilter) => {
      void setRoleParam(next === "all" ? null : next);
    },
    [setRoleParam],
  );

  const setStatus = useCallback(
    (next: StatusFilter) => {
      void setStatusParam(next === "all" ? null : next);
    },
    [setStatusParam],
  );

  const setSearch = useCallback(
    (next: string) => {
      void setSearchParam(next.length === 0 ? null : next);
    },
    [setSearchParam],
  );

  return {
    role,
    status,
    searchQuery: search,
    roleFilter: role ?? "all",
    statusFilter: status ?? "all",
    setRole,
    setStatus,
    setSearch,
  };
}
