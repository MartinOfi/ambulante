import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { USER_ROLES } from "@/shared/constants/user";
import { getSuspensionStatus, SUSPENSION_STATUS } from "@/shared/domain/user-suspension";
import type { UserRole } from "@/shared/schemas/user";
import type { UserTableProps } from "./UserTable.types";

const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.client]: "Cliente",
  [USER_ROLES.store]: "Tienda",
  [USER_ROLES.admin]: "Admin",
};

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  [USER_ROLES.client]: "default",
  [USER_ROLES.store]: "secondary",
  [USER_ROLES.admin]: "outline",
};

export function UserTable({ users, pendingUserId, onSuspend, onReactivate, onView }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-12 text-center">
        <p className="text-[hsl(var(--muted))]">No hay usuarios para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
            <th scope="col" className="px-4 py-3 text-left font-medium text-[hsl(var(--muted))]">
              Usuario
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-[hsl(var(--muted))]">
              Rol
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-[hsl(var(--muted))]">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-[hsl(var(--muted))]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))]">
          {users.map((user) => {
            const status = getSuspensionStatus(user);
            const isSuspended = status === SUSPENSION_STATUS.SUSPENDED;
            const isPending = pendingUserId === user.id;
            const isAdmin = user.role === USER_ROLES.admin;

            return (
              <tr
                key={user.id}
                className={cn(
                  "transition-colors duration-150 hover:bg-[hsl(var(--surface))]",
                  isSuspended && "opacity-60",
                )}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">
                      {user.displayName ?? "Sin nombre"}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted))]">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                </td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onView(user.id)}
                      aria-label={`Ver detalle de ${user.email}`}
                    >
                      Ver
                    </Button>
                    {isSuspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => onReactivate(user.id)}
                        aria-label={`Reactivar usuario ${user.email}`}
                      >
                        {isPending ? "Procesando…" : "Reactivar"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending || isAdmin}
                        onClick={() => onSuspend(user.id)}
                        aria-label={`Suspender usuario ${user.email}`}
                      >
                        {isPending ? "Procesando…" : "Suspender"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
