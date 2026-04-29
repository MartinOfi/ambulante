import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";

export type RoleFilter = UserRole | "all";
export type StatusFilter = SuspensionStatus | "all";

export interface UserFiltersBarProps {
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  readonly searchQuery: string;
  readonly onRoleChange: (role: RoleFilter) => void;
  readonly onStatusChange: (status: StatusFilter) => void;
  readonly onSearchChange: (query: string) => void;
}
