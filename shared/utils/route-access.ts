import type { UserRole } from "@/shared/types/user";
import { USER_ROLES } from "@/shared/constants/user";

const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: "/map", role: USER_ROLES.client },
  { prefix: "/orders", role: USER_ROLES.client },
  { prefix: "/profile", role: USER_ROLES.client },
  { prefix: "/store", role: "tienda" },
  { prefix: "/admin", role: "admin" },
];

// Next.js config.matcher requires static literals and cannot reference this array.
// Keep middleware.ts matchers in sync with PROTECTED_PREFIXES manually.
export const MIDDLEWARE_MATCHERS = PROTECTED_PREFIXES.map(({ prefix }) => `${prefix}/:path*`);

export function getRequiredRole(pathname: string): UserRole | null {
  for (const { prefix, role } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}
