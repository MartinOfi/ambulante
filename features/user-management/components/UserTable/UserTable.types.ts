import type { User } from "@/shared/schemas/user";

export interface UserTableProps {
  readonly users: readonly User[];
  readonly pendingUserId: string | null;
  readonly onSuspend: (userId: string) => void;
  readonly onReinstate: (userId: string) => void;
}
