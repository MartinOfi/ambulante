import type { User } from "@/shared/schemas/user";

export interface UserManagementPageProps {
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly pendingUserId: string | null;
  readonly suspendDialogEmail: string | null;
  readonly isSuspendPending: boolean;
  readonly onSuspendRequest: (userId: string) => void;
  readonly onSuspendConfirm: () => void;
  readonly onSuspendCancel: () => void;
  readonly onReinstate: (userId: string) => void;
}
