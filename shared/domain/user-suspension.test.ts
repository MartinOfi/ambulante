import { describe, it, expect } from "vitest";
import {
  SUSPENSION_STATUS,
  getSuspensionStatus,
  assertCanSuspend,
  assertCanReactivate,
  isProtectedRole,
} from "@/shared/domain/user-suspension";
import { USER_ROLES } from "@/shared/constants/user";
import type { User } from "@/shared/schemas/user";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    role: USER_ROLES.client,
    displayName: "Test",
    suspended: false,
    ...overrides,
  };
}

describe("user-suspension state machine", () => {
  describe("getSuspensionStatus", () => {
    it("returns ACTIVE when user.suspended is false", () => {
      expect(getSuspensionStatus(makeUser({ suspended: false }))).toBe(SUSPENSION_STATUS.ACTIVE);
    });

    it("returns ACTIVE when user.suspended is undefined", () => {
      expect(getSuspensionStatus(makeUser({ suspended: undefined }))).toBe(
        SUSPENSION_STATUS.ACTIVE,
      );
    });

    it("returns SUSPENDED when user.suspended is true", () => {
      expect(getSuspensionStatus(makeUser({ suspended: true }))).toBe(SUSPENSION_STATUS.SUSPENDED);
    });
  });

  describe("assertCanSuspend", () => {
    it("does not throw for an active client", () => {
      expect(() => assertCanSuspend(makeUser({ suspended: false }))).not.toThrow();
    });

    it("does not throw for an active store", () => {
      expect(() =>
        assertCanSuspend(makeUser({ role: USER_ROLES.store, suspended: false })),
      ).not.toThrow();
    });

    it("throws when user is already suspended", () => {
      expect(() => assertCanSuspend(makeUser({ suspended: true }))).toThrow(
        /ya está suspendido/i,
      );
    });

    it("throws when target is admin (protected role)", () => {
      expect(() => assertCanSuspend(makeUser({ role: USER_ROLES.admin }))).toThrow(
        /no se puede suspender/i,
      );
    });
  });

  describe("assertCanReactivate", () => {
    it("does not throw when user is suspended", () => {
      expect(() => assertCanReactivate(makeUser({ suspended: true }))).not.toThrow();
    });

    it("throws when user is not suspended", () => {
      expect(() => assertCanReactivate(makeUser({ suspended: false }))).toThrow(/no está suspendido/i);
    });

    it("throws when user is undefined-suspended (treated as active)", () => {
      expect(() => assertCanReactivate(makeUser({ suspended: undefined }))).toThrow();
    });
  });

  describe("isProtectedRole", () => {
    it("returns true for admin", () => {
      expect(isProtectedRole(USER_ROLES.admin)).toBe(true);
    });

    it("returns false for client and store", () => {
      expect(isProtectedRole(USER_ROLES.client)).toBe(false);
      expect(isProtectedRole(USER_ROLES.store)).toBe(false);
    });
  });
});
