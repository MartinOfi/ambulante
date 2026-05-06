import type { User } from "@/shared/schemas/user";
import type {
  RoleFilter,
  StatusFilter,
} from "@/features/user-management/components/UserFiltersBar";

export interface UserManagementPageProps {
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly pendingUserId: string | null;
  readonly roleFilter: RoleFilter;
  readonly statusFilter: StatusFilter;
  readonly searchQuery: string;
  readonly suspendDialogEmail: string | null;
  readonly suspendReason: string;
  readonly isSuspendPending: boolean;
  readonly suspendErrorMessage: string | null;
  readonly onRoleChange: (role: RoleFilter) => void;
  readonly onStatusChange: (status: StatusFilter) => void;
  readonly onSearchChange: (query: string) => void;
  readonly onSuspendRequest: (userId: string) => void;
  readonly onSuspendConfirm: () => void;
  readonly onSuspendCancel: () => void;
  readonly onSuspendReasonChange: (reason: string) => void;
  readonly onReactivate: (userId: string) => void;
  readonly onView: (userId: string) => void;
  readonly currentPage: number;
  readonly hasNextPage: boolean;
  readonly onPageChange: (page: number) => void;
}
