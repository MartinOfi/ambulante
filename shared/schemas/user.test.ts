import { describe, expect, it } from "vitest";
import { userRoleSchema, userSchema, sessionSchema } from "./user";

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

describe("sessionSchema", () => {
  const validUser = {
    id: "user-1",
    email: "store@example.com",
    role: "store",
  };

  const validSession = {
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
    refreshToken: "refresh-token-abc123",
    expiresAt: 1800000000,
    user: validUser,
  };

  it("accepts a valid session", () => {
    const result = sessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it("rejects empty accessToken", () => {
    const result = sessionSchema.safeParse({ ...validSession, accessToken: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty refreshToken", () => {
    const result = sessionSchema.safeParse({ ...validSession, refreshToken: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative expiresAt", () => {
    const result = sessionSchema.safeParse({ ...validSession, expiresAt: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero expiresAt", () => {
    const result = sessionSchema.safeParse({ ...validSession, expiresAt: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid nested user", () => {
    const result = sessionSchema.safeParse({
      ...validSession,
      user: { ...validUser, email: "bad-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const { accessToken: _at, ...withoutToken } = validSession;
    const result = sessionSchema.safeParse(withoutToken);
    expect(result.success).toBe(false);
  });

  it("infers Session type with correct shape", () => {
    const parsed = sessionSchema.parse(validSession);
    expect(parsed.user.role).toBe("store");
    expect(typeof parsed.expiresAt).toBe("number");
  });
});
