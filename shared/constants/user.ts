/**
 * Domain constants for user roles.
 * Source of truth: PRD §4 (Usuarios y roles).
 */

export const USER_ROLES = Object.freeze({
  CLIENTE: "CLIENTE",
  TIENDA: "TIENDA",
  ADMIN: "ADMIN",
} as const);

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
