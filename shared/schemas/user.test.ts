import { describe, expect, it } from "vitest";
import { userRoleSchema, userSchema } from "./user";

describe("userRoleSchema", () => {
  it("accepts valid roles", () => {
    expect(userRoleSchema.safeParse("client").success).toBe(true);
    expect(userRoleSchema.safeParse("store").success).toBe(true);
    expect(userRoleSchema.safeParse("admin").success).toBe(true);
  });

  it("rejects unknown role", () => {
    expect(userRoleSchema.safeParse("superuser").success).toBe(false);
  });
});

describe("userSchema", () => {
  const validUser = {
    id: "user-1",
    email: "cliente@example.com",
    role: "client",
    displayName: "Juan Pérez",
  };

  it("accepts a valid user", () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = userSchema.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows optional displayName", () => {
    const { displayName: _d, ...withoutName } = validUser;
    const result = userSchema.safeParse(withoutName);
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = userSchema.safeParse({ ...validUser, id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = userSchema.safeParse({ ...validUser, role: "owner" });
    expect(result.success).toBe(false);
  });
});
