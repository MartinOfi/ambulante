import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { USER_ROLES } from "@/shared/constants/user";
import { getSuspensionStatus, SUSPENSION_STATUS } from "@/shared/domain/user-suspension";
import type { UserRole } from "@/shared/schemas/user";
import { SuspendConfirmDialog } from "@/features/user-management/components/SuspendConfirmDialog";
import { UserOrdersTable } from "@/features/user-management/components/UserOrdersTable";
import type { UserDetailPageProps } from "./UserDetailPage.types";

const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.client]: "Cliente",
  [USER_ROLES.store]: "Tienda",
  [USER_ROLES.admin]: "Administrador",
};

export function UserDetailPage({
  user,
  orders,
  isLoading,
  errorMessage,
  mutationErrorMessage,
  suspendDialogOpen,
  suspendReason,
  isSuspendPending,
  isReactivatePending,
  onBack,
  onSuspendRequest,
  onSuspendCancel,
  onSuspendConfirm,
  onSuspendReasonChange,
  onReactivate,
}: UserDetailPageProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-[hsl(var(--surface))]" />
        <div className="h-32 animate-pulse rounded-lg bg-[hsl(var(--surface))]" />
        <div className="h-48 animate-pulse rounded-lg bg-[hsl(var(--surface))]" />
      </div>
    );
  }

  if (errorMessage !== null || user === null) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Volver
        </Button>
        <div
          role="alert"
          className="rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/.1)] px-4 py-3 text-sm text-[hsl(var(--destructive))]"
        >
          {errorMessage ?? "Usuario no encontrado."}
        </div>
      </div>
    );
  }

  const status = getSuspensionStatus(user);
  const isSuspended = status === SUSPENSION_STATUS.SUSPENDED;
  const isAdmin = user.role === USER_ROLES.admin;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Volver al listado
      </Button>

      {mutationErrorMessage !== null && (
        <div
          role="alert"
          className="rounded-lg border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/.1)] px-4 py-3 text-sm text-[hsl(var(--destructive))]"
        >
          {mutationErrorMessage}
        </div>
      )}

      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              {user.displayName ?? "Sin nombre"}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted))]">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
              {isSuspended ? (
                <Badge variant="destructive">Suspendido</Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-[hsl(var(--success))] text-[hsl(var(--success))]"
                >
                  Activo
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuspended ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isReactivatePending}
                onClick={onReactivate}
              >
                {isReactivatePending ? "Procesando…" : "Reactivar"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                disabled={isSuspendPending || isAdmin}
                onClick={onSuspendRequest}
              >
                {isSuspendPending ? "Procesando…" : "Suspender"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-[hsl(var(--foreground))]">
          Pedidos del usuario ({orders.length})
        </h2>
        <UserOrdersTable orders={orders} />
      </div>

      <SuspendConfirmDialog
        isOpen={suspendDialogOpen}
        userEmail={user.email}
        reason={suspendReason}
        isPending={isSuspendPending}
        errorMessage={mutationErrorMessage}
        onReasonChange={onSuspendReasonChange}
        onConfirm={onSuspendConfirm}
        onCancel={onSuspendCancel}
      />
    </div>
  );
}
