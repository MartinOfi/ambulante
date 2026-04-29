import type { Order } from "@/shared/schemas/order";
import type { User } from "@/shared/schemas/user";

export interface UserDetailPageProps {
  readonly user: User | null;
  readonly orders: readonly Order[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly mutationErrorMessage: string | null;
  readonly suspendDialogOpen: boolean;
  readonly suspendReason: string;
  readonly isSuspendPending: boolean;
  readonly isReactivatePending: boolean;
  readonly onBack: () => void;
  readonly onSuspendRequest: () => void;
  readonly onSuspendCancel: () => void;
  readonly onSuspendConfirm: () => void;
  readonly onSuspendReasonChange: (reason: string) => void;
  readonly onReactivate: () => void;
}
