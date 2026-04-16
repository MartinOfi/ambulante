import type { UserRole } from "@/shared/types/user";

const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: "/map", role: "client" },
  { prefix: "/store", role: "store" },
  { prefix: "/admin", role: "admin" },
];

// Derived from PROTECTED_PREFIXES — single source of truth for the matcher in middleware.ts
export const MIDDLEWARE_MATCHERS = PROTECTED_PREFIXES.map(({ prefix }) => `${prefix}/:path*`);

export function getRequiredRole(pathname: string): UserRole | null {
  for (const { prefix, role } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}
