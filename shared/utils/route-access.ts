import type { UserRole } from "@/shared/types/user";

const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: "/map", role: "client" },
  { prefix: "/store", role: "store" },
  { prefix: "/admin", role: "admin" },
];

export function getRequiredRole(pathname: string): UserRole | null {
  for (const { prefix, role } of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role;
    }
  }
  return null;
}
