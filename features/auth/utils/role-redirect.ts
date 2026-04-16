import { ROUTES } from "@/shared/constants/routes";
import { USER_ROLES } from "@/shared/constants/user";
import type { UserRole } from "@/shared/types/user";

const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  [USER_ROLES.client]: ROUTES.client.map,
  [USER_ROLES.store]: ROUTES.store.dashboard,
  [USER_ROLES.admin]: ROUTES.admin.dashboard,
};

export function getRoleRedirect(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] ?? ROUTES.public.home;
}
