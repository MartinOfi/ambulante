import { USER_ROLES } from "@/shared/constants/user";
import {
  USER_SUSPENSION_STATUS,
  type UserSuspensionStatus,
} from "@/shared/constants/user-management";
import type { User, UserRole } from "@/shared/schemas/user";

export const SUSPENSION_STATUS = USER_SUSPENSION_STATUS;
export type SuspensionStatus = UserSuspensionStatus;

export class UserManagementDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserManagementDomainError";
  }
}

const PROTECTED_ROLES: readonly UserRole[] = [USER_ROLES.admin];

export function isProtectedRole(role: UserRole): boolean {
  return PROTECTED_ROLES.includes(role);
}

export function getSuspensionStatus(user: Pick<User, "suspended">): SuspensionStatus {
  return user.suspended === true ? SUSPENSION_STATUS.SUSPENDED : SUSPENSION_STATUS.ACTIVE;
}

export function assertCanSuspend(user: Pick<User, "suspended" | "role">): void {
  if (isProtectedRole(user.role)) {
    throw new UserManagementDomainError("No se puede suspender a un usuario administrador");
  }
  if (getSuspensionStatus(user) === SUSPENSION_STATUS.SUSPENDED) {
    throw new UserManagementDomainError("El usuario ya está suspendido");
  }
}

export function assertCanReactivate(user: Pick<User, "suspended">): void {
  if (getSuspensionStatus(user) === SUSPENSION_STATUS.ACTIVE) {
    throw new UserManagementDomainError("El usuario no está suspendido");
  }
}
