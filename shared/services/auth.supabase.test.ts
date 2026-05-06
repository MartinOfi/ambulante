import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockMaybySingle, mockFrom } = vi.hoisted(() => {
  const mockMaybySingle = vi.fn().mockResolvedValue({
    data: { public_id: "public-user-123" },
    error: null,
  });
  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybySingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOtp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
  return { mockAuth, mockMaybySingle, mockFrom };
});

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ auth: mockAuth, from: mockFrom })),
}));

import { supabaseAuthService } from "./auth.supabase";

const mockSupabaseUser = {
  id: "user-123",
  email: "test@example.com",
  user_metadata: { role: "client", displayName: "Test User" },
  app_metadata: {},
};

const mockSupabaseSession = {
  access_token: "access-token-123",
  refresh_token: "refresh-token-123",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  user: mockSupabaseUser,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default: resolves public_id for user-123
  mockMaybySingle.mockResolvedValue({ data: { public_id: "public-user-123" }, error: null });
});

describe("supabaseAuthService.signIn", () => {
  it("returns mapped session on success with public_id as user.id", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: mockSupabaseSession, user: mockSupabaseUser },
      error: null,
    });

    const result = await supabaseAuthService.signIn({
      email: "test@example.com",
      password: "password",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessToken).toBe("access-token-123");
      expect(result.data.refreshToken).toBe("refresh-token-123");
      expect(result.data.user.id).toBe("public-user-123");
      expect(result.data.user.email).toBe("test@example.com");
      expect(result.data.user.role).toBe("client");
      expect(result.data.user.displayName).toBe("Test User");
    }
  });

  it("falls back to auth.uid() when public.users lookup fails", async () => {
    const fallbackUser = { ...mockSupabaseUser, id: "user-no-public-row" };
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        session: { ...mockSupabaseSession, user: fallbackUser },
        user: fallbackUser,
      },
      error: null,
    });
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } });

    const result = await supabaseAuthService.signIn({
      email: "test@example.com",
      password: "password",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.id).toBe("user-no-public-row");
    }
  });

  it("returns error when Supabase returns error", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials", status: 400 },
    });

    const result = await supabaseAuthService.signIn({
      email: "test@example.com",
      password: "wrong",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns error when session is null", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: mockSupabaseUser },
      error: null,
    });

    const result = await supabaseAuthService.signIn({
      email: "test@example.com",
      password: "password",
    });

    expect(result.success).toBe(false);
  });
});

describe("supabaseAuthService.signUp", () => {
  it("returns session with public_id when email confirmation is disabled", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: mockSupabaseSession, user: mockSupabaseUser },
      error: null,
    });

    const result = await supabaseAuthService.signUp({
      email: "new@example.com",
      password: "password123",
      role: "client",
    });

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.user.id).toBe("public-user-123");
      expect(result.data.user.email).toBe("test@example.com");
    }
  });

  it("returns success with null data when session is null (email confirmation required)", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: null, user: mockSupabaseUser },
      error: null,
    });

    const result = await supabaseAuthService.signUp({
      email: "new@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("returns error on Supabase error", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered", status: 422 },
    });

    const result = await supabaseAuthService.signUp({
      email: "existing@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("passes role and displayName in user metadata", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: mockSupabaseSession, user: mockSupabaseUser },
      error: null,
    });

    await supabaseAuthService.signUp({
      email: "new@example.com",
      password: "password123",
      role: "store",
      displayName: "Mi Tienda",
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      options: { data: { role: "store", displayName: "Mi Tienda" } },
    });
  });
});

describe("supabaseAuthService.signInWithMagicLink", () => {
  it("returns success when OTP is sent", async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const result = await supabaseAuthService.signInWithMagicLink({
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: { emailRedirectTo: undefined },
    });
  });

  it("passes redirectTo option", async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    await supabaseAuthService.signInWithMagicLink({
      email: "test@example.com",
      redirectTo: "https://app.com/auth/callback",
    });

    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: { emailRedirectTo: "https://app.com/auth/callback" },
    });
  });

  it("returns error on failure", async () => {
    mockAuth.signInWithOtp.mockResolvedValue({
      data: {},
      error: { message: "Rate limit exceeded", status: 429 },
    });

    const result = await supabaseAuthService.signInWithMagicLink({
      email: "test@example.com",
    });

    expect(result.success).toBe(false);
  });
});

describe("supabaseAuthService.signInWithGoogle", () => {
  it("returns URL on success", async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com/o/oauth2/auth?foo=bar" },
      error: null,
    });

    const result = await supabaseAuthService.signInWithGoogle();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toContain("google.com");
    }
  });

  it("passes redirectTo and skipBrowserRedirect options", async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com/..." },
      error: null,
    });

    await supabaseAuthService.signInWithGoogle({
      redirectTo: "https://app.com/auth/callback",
    });

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://app.com/auth/callback",
        skipBrowserRedirect: true,
      },
    });
  });

  it("returns error on Supabase error", async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: { message: "OAuth error", status: 500 },
    });

    const result = await supabaseAuthService.signInWithGoogle();

    expect(result.success).toBe(false);
  });

  it("returns error when url is null even without an error (provider misconfiguration)", async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: null,
    });

    const result = await supabaseAuthService.signInWithGoogle();

    expect(result.success).toBe(false);
  });
});

describe("supabaseAuthService.signOut", () => {
  it("returns success", async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });

    const result = await supabaseAuthService.signOut();

    expect(result.success).toBe(true);
  });

  it("returns error on failure", async () => {
    mockAuth.signOut.mockResolvedValue({
      error: { message: "Sign out failed", status: 500 },
    });

    const result = await supabaseAuthService.signOut();

    expect(result.success).toBe(false);
  });
});

describe("supabaseAuthService.getSession", () => {
  it("returns mapped session with public_id when active session exists", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: mockSupabaseSession },
      error: null,
    });

    const session = await supabaseAuthService.getSession();

    expect(session).not.toBeNull();
    expect(session?.accessToken).toBe("access-token-123");
    expect(session?.user.email).toBe("test@example.com");
    expect(session?.user.id).toBe("public-user-123");
  });

  it("returns null when no session", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await supabaseAuthService.getSession();

    expect(session).toBeNull();
  });

  it("returns null on error", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Network error", status: 500 },
    });

    const session = await supabaseAuthService.getSession();

    expect(session).toBeNull();
  });
});

describe("supabaseAuthService.getUser", () => {
  it("returns mapped user with public_id when authenticated", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const user = await supabaseAuthService.getUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe("public-user-123");
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("client");
    expect(user?.displayName).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const user = await supabaseAuthService.getUser();

    expect(user).toBeNull();
  });

  it("uses app_metadata.role when user_metadata.role is absent", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: { ...mockSupabaseUser, user_metadata: {}, app_metadata: { role: "store" } },
      },
      error: null,
    });

    const user = await supabaseAuthService.getUser();

    expect(user?.role).toBe("store");
  });

  it("defaults to client role when no role metadata", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: { ...mockSupabaseUser, user_metadata: {}, app_metadata: {} },
      },
      error: null,
    });

    const user = await supabaseAuthService.getUser();

    expect(user?.role).toBe("client");
  });

  it("returns null on error", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Unauthorized", status: 401 },
    });

    const user = await supabaseAuthService.getUser();

    expect(user).toBeNull();
  });
});

describe("supabaseAuthService.onAuthStateChange", () => {
  it("calls callback with mapped session (public_id) when event fires", async () => {
    const mockUnsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockImplementation(
      (cb: (event: string, session: typeof mockSupabaseSession | null) => void) => {
        cb("SIGNED_IN", mockSupabaseSession);
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    );

    let received: unknown = "sentinel";
    const unsubscribe = supabaseAuthService.onAuthStateChange((session) => {
      received = session;
    });

    // Inner callback is async — flush microtasks before asserting
    await vi.waitFor(() => expect(received).not.toBe("sentinel"));

    expect(received).not.toBeNull();
    expect((received as { accessToken: string }).accessToken).toBe("access-token-123");
    expect((received as { user: { id: string } }).user.id).toBe("public-user-123");

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("calls callback with null when session is null", () => {
    const mockUnsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockImplementation((cb: (event: string, session: null) => void) => {
      cb("SIGNED_OUT", null);
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    let received: unknown = "sentinel";
    supabaseAuthService.onAuthStateChange((session) => {
      received = session;
    });

    // null path has no await — callback fires synchronously
    expect(received).toBeNull();
  });

  it("returns unsubscribe function that calls subscription.unsubscribe", () => {
    const mockUnsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const unsubscribe = supabaseAuthService.onAuthStateChange(() => {});
    unsubscribe();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
