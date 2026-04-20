import { UserTable } from "@/features/user-management/components/UserTable";
import { SuspendConfirmDialog } from "@/features/user-management/components/SuspendConfirmDialog";
import type { UserManagementPageProps } from "./UserManagementPage.types";

export function UserManagementPage({
  users,
  isLoading,
  errorMessage,
  pendingUserId,
  suspendDialogEmail,
  isSuspendPending,
  onSuspendRequest,
  onSuspendConfirm,
  onSuspendCancel,
  onReinstate,
}: UserManagementPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
          Gestión de usuarios
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Suspendé o reactivá cuentas de clientes y tiendas.
        </p>
      </div>

      {errorMessage !== null && (
        <div
          role="alert"
          className="rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/.1)] px-4 py-3 text-sm text-[hsl(var(--destructive))]"
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-[hsl(var(--surface))]" />
          ))}
        </div>
      ) : (
        <UserTable
          users={users}
          pendingUserId={pendingUserId}
          onSuspend={onSuspendRequest}
          onReinstate={onReinstate}
        />
      )}

      <SuspendConfirmDialog
        isOpen={suspendDialogEmail !== null}
        userEmail={suspendDialogEmail ?? ""}
        isPending={isSuspendPending}
        onConfirm={onSuspendConfirm}
        onCancel={onSuspendCancel}
      />
    </div>
  );
}
