import type { UserRole } from "@/shared/schemas/user";

export const USER_ROLES = Object.freeze({
  client: "client",
  store: "store",
  admin: "admin",
} as const satisfies Record<UserRole, UserRole>);
