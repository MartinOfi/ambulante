import { describe, it, expect } from "vitest";
import { parseSessionCookie, serializeSessionCookie } from "./session-cookie";
import type { Session } from "@/shared/types/user";

const VALID_SESSION: Session = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: "user-1",
    email: "client@test.com",
    role: "client",
  },
};

describe("parseSessionCookie", () => {
  it("returns null for empty string", () => {
    expect(parseSessionCookie("")).toBeNull();
  });

  it("returns null for non-base64 string", () => {
    expect(parseSessionCookie("not-base64!!!")).toBeNull();
  });

  it("returns null for base64 of non-JSON", () => {
    expect(parseSessionCookie(btoa("not json {{{"))).toBeNull();
  });

  it("returns null for base64 JSON that fails sessionSchema", () => {
    const invalid = btoa(JSON.stringify({ accessToken: "x" }));
    expect(parseSessionCookie(invalid)).toBeNull();
  });

  it("returns Session for valid encoded session", () => {
    const encoded = btoa(JSON.stringify(VALID_SESSION));
    const result = parseSessionCookie(encoded);
    expect(result).toEqual(VALID_SESSION);
  });

  it("returns null when session has an invalid role", () => {
    const withBadRole = { ...VALID_SESSION, user: { ...VALID_SESSION.user, role: "superadmin" } };
    const encoded = btoa(JSON.stringify(withBadRole));
    expect(parseSessionCookie(encoded)).toBeNull();
  });

  it("returns null for an expired session", () => {
    const expired = { ...VALID_SESSION, expiresAt: Math.floor(Date.now() / 1000) - 1 };
    const encoded = btoa(JSON.stringify(expired));
    expect(parseSessionCookie(encoded)).toBeNull();
  });
});

describe("serializeSessionCookie", () => {
  it("returns a non-empty string", () => {
    expect(serializeSessionCookie(VALID_SESSION)).toBeTruthy();
  });

  it("round-trips: parseSessionCookie(serialize(session)) returns original session", () => {
    const serialized = serializeSessionCookie(VALID_SESSION);
    const parsed = parseSessionCookie(serialized);
    expect(parsed).toEqual(VALID_SESSION);
  });
});
