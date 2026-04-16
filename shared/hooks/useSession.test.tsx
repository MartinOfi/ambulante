import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSession } from "./useSession";
import type { AuthService } from "@/shared/services/auth.types";
import type { Session } from "@/shared/types/user";

const MOCK_SESSION: Session = {
  accessToken: "tok-access",
  refreshToken: "tok-refresh",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: "user-1",
    email: "client@test.com",
    role: "client",
  },
};

function makeMockService(initial: Session | null = null): AuthService {
  let session = initial;
  const listeners = new Set<(s: Session | null) => void>();

  return {
    getSession: vi.fn(async () => session),
    signIn: vi.fn(async () => {
      session = MOCK_SESSION;
      listeners.forEach((cb) => cb(session));
      return { success: true as const, data: MOCK_SESSION };
    }),
    signUp: vi.fn(async () => {
      session = MOCK_SESSION;
      listeners.forEach((cb) => cb(session));
      return { success: true as const, data: MOCK_SESSION };
    }),
    signOut: vi.fn(async () => {
      session = null;
      listeners.forEach((cb) => cb(null));
      return { success: true as const, data: undefined };
    }),
    onAuthStateChange: vi.fn((cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }),
  };
}

describe("useSession", () => {
  let service: AuthService;

  beforeEach(() => {
    service = makeMockService();
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useSession(service));
    expect(result.current.status).toBe("loading");
  });

  it("transitions to unauthenticated when no session exists", async () => {
    const { result } = renderHook(() => useSession(service));
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
  });

  it("transitions to authenticated when session exists", async () => {
    service = makeMockService(MOCK_SESSION);
    const { result } = renderHook(() => useSession(service));
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    if (result.current.status === "authenticated") {
      expect(result.current.session.user.email).toBe("client@test.com");
    }
  });

  it("updates to authenticated after signIn", async () => {
    const { result } = renderHook(() => useSession(service));
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    await act(async () => {
      await result.current.signIn({ email: "client@test.com", password: "password" });
    });

    expect(result.current.status).toBe("authenticated");
  });

  it("updates to unauthenticated after signOut", async () => {
    service = makeMockService(MOCK_SESSION);
    const { result } = renderHook(() => useSession(service));
    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe("unauthenticated");
  });

  it("subscribes to auth state changes on mount", async () => {
    renderHook(() => useSession(service));
    await waitFor(() => expect(service.onAuthStateChange).toHaveBeenCalledOnce());
  });

  it("unsubscribes on unmount", async () => {
    const unsubscribeSpy = vi.fn();
    vi.spyOn(service, "onAuthStateChange").mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useSession(service));
    await waitFor(() => expect(service.onAuthStateChange).toHaveBeenCalled());

    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });

  it("exposes signIn and signOut actions", async () => {
    const { result } = renderHook(() => useSession(service));
    await waitFor(() => expect(result.current.status).not.toBe("loading"));

    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
  });
});
