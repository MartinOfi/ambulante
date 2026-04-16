import { describe, it, expect } from "vitest";
import { USER_ROLES } from "./user";

describe("USER_ROLES", () => {
  it("contains all roles defined in PRD §4", () => {
    expect(USER_ROLES).toHaveProperty("client");
    expect(USER_ROLES).toHaveProperty("store");
    expect(USER_ROLES).toHaveProperty("admin");
  });

  it("values match schema UserRole literals", () => {
    expect(USER_ROLES.client).toBe("client");
    expect(USER_ROLES.store).toBe("store");
    expect(USER_ROLES.admin).toBe("admin");
  });

  it("has exactly 3 roles (PRD §4 defines three roles)", () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(3);
  });

  it("is a frozen object (immutable)", () => {
    expect(Object.isFrozen(USER_ROLES)).toBe(true);
  });
});
