import { describe, it, expect } from "vitest";
import { USER_ROLES, type UserRole } from "./user";

describe("USER_ROLES", () => {
  it("contains all roles defined in PRD §4", () => {
    expect(USER_ROLES).toHaveProperty("CLIENTE");
    expect(USER_ROLES).toHaveProperty("TIENDA");
    expect(USER_ROLES).toHaveProperty("ADMIN");
  });

  it("values match their keys", () => {
    expect(USER_ROLES.CLIENTE).toBe("CLIENTE");
    expect(USER_ROLES.TIENDA).toBe("TIENDA");
    expect(USER_ROLES.ADMIN).toBe("ADMIN");
  });

  it("has exactly 3 roles (PRD §4 defines three roles)", () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(3);
  });

  it("is a frozen object (immutable)", () => {
    expect(Object.isFrozen(USER_ROLES)).toBe(true);
  });
});

// Compile-time exhaustiveness check via type assignment
// If a new role is added without updating UserRole, this becomes a type error.
type AssertAllRolesCovered = {
  [K in UserRole]: true;
};

const _exhaustive: AssertAllRolesCovered = {
  CLIENTE: true,
  TIENDA: true,
  ADMIN: true,
};

void _exhaustive; // suppress unused warning
