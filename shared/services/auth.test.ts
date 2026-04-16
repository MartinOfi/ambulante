import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "./auth";

beforeEach(async () => {
  await authService.signOut();
});

describe("authService.getSession", () => {
  it("returns null when not authenticated", async () => {
    const session = await authService.getSession();
    expect(session).toBeNull();
  });

  it("returns session after successful signIn", async () => {
    await authService.signIn({ email: "client@test.com", password: "password" });
    const session = await authService.getSession();
    expect(session).not.toBeNull();
    expect(session?.user.email).toBe("client@test.com");
  });
});

describe("authService.signIn", () => {
  it("returns success with session for valid credentials", async () => {
    const result = await authService.signIn({
      email: "client@test.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessToken).toBeTruthy();
      expect(result.data.refreshToken).toBeTruthy();
      expect(result.data.expiresAt).toBeGreaterThan(0);
      expect(result.data.user.email).toBe("client@test.com");
      expect(result.data.user.role).toBe("client");
    }
  });

  it("returns error for unknown email", async () => {
    const result = await authService.signIn({
      email: "unknown@test.com",
      password: "password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns error for wrong password", async () => {
    const result = await authService.signIn({
      email: "client@test.com",
      password: "wrong",
    });
    expect(result.success).toBe(false);
  });

  it("seeds a store user with role store", async () => {
    const result = await authService.signIn({
      email: "store@test.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.role).toBe("store");
    }
  });

  it("seeds an admin user with role admin", async () => {
    const result = await authService.signIn({
      email: "admin@test.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.role).toBe("admin");
    }
  });
});

describe("authService.signUp", () => {
  it("creates a new user and returns session", async () => {
    const result = await authService.signUp({
      email: "new@test.com",
      password: "password",
      role: "client",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.email).toBe("new@test.com");
      expect(result.data.user.role).toBe("client");
    }
  });

  it("defaults role to client when omitted", async () => {
    const result = await authService.signUp({
      email: "noRole@test.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.role).toBe("client");
    }
  });

  it("returns error when email already registered", async () => {
    await authService.signUp({ email: "dup@test.com", password: "password" });
    const result = await authService.signUp({
      email: "dup@test.com",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("authService.signOut", () => {
  it("clears the session", async () => {
    await authService.signIn({ email: "client@test.com", password: "password" });
    const before = await authService.getSession();
    expect(before).not.toBeNull();

    await authService.signOut();
    const after = await authService.getSession();
    expect(after).toBeNull();
  });

  it("returns success even when already signed out", async () => {
    const result = await authService.signOut();
    expect(result.success).toBe(true);
  });
});

describe("authService.onAuthStateChange", () => {
  it("calls callback with session after signIn", async () => {
    let received: Parameters<Parameters<typeof authService.onAuthStateChange>[0]>[0] = null;
    authService.onAuthStateChange((s) => {
      received = s;
    });

    await authService.signIn({ email: "client@test.com", password: "password" });
    expect(received).not.toBeNull();
  });

  it("calls callback with null after signOut", async () => {
    await authService.signIn({ email: "client@test.com", password: "password" });

    let received: Parameters<Parameters<typeof authService.onAuthStateChange>[0]>[0] =
      "sentinel" as unknown as null;
    authService.onAuthStateChange((s) => {
      received = s;
    });

    await authService.signOut();
    expect(received).toBeNull();
  });

  it("unsubscribe stops receiving updates", async () => {
    let callCount = 0;
    const unsubscribe = authService.onAuthStateChange(() => {
      callCount++;
    });

    await authService.signIn({ email: "client@test.com", password: "password" });
    expect(callCount).toBe(1);

    unsubscribe();
    await authService.signOut();
    expect(callCount).toBe(1);
  });
});
