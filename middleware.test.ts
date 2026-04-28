import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function makeRequest(path: string, headers: Record<string, string> = {}): NextRequest {
  const url = `http://localhost${path}`;
  return new NextRequest(url, { headers });
}

// --- Rate limit mock (stateful per describe block, reset in beforeEach) ---
const rateLimitStore = new Map<string, number>();

vi.mock("@/shared/services/rate-limit", () => ({
  createRateLimitService: () => ({
    check: vi.fn(({ identifier }: { identifier: string }) => {
      const count = (rateLimitStore.get(identifier) ?? 0) + 1;
      rateLimitStore.set(identifier, count);
      return Promise.resolve({
        allowed: count <= 3,
        remaining: Math.max(0, 3 - count),
        resetAtMs: Date.now() + 60_000,
      });
    }),
  }),
}));

// --- Supabase middleware client mock ---
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/shared/repositories/supabase/client", () => ({
  createMiddlewareClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

function mockAuthenticatedAs(userId: string, role: string) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { role } }),
      }),
    }),
  });
}

function mockAuthenticatedNoAppUser(userId: string) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null }),
      }),
    }),
  });
}

describe("middleware — rate limiting", () => {
  beforeEach(() => {
    rateLimitStore.clear();
    mockUnauthenticated();
  });

  it("returns 400 when no IP header is present on API route", async () => {
    const response = await middleware(makeRequest("/api/test"));
    expect(response.status).toBe(400);
  });

  it("uses x-real-ip as identifier", async () => {
    const response = await middleware(makeRequest("/api/test", { "x-real-ip": "1.2.3.4" }));
    expect(response.status).toBe(200);
  });

  it("uses the last x-forwarded-for entry, not the first", async () => {
    const response = await middleware(
      makeRequest("/api/test", { "x-forwarded-for": "attacker-ip, trusted-proxy-ip" }),
    );
    expect(response.status).toBe(200);
  });

  it("prefers x-real-ip over x-forwarded-for", async () => {
    const response = await middleware(
      makeRequest("/api/test", { "x-real-ip": "real-ip", "x-forwarded-for": "other-ip" }),
    );
    expect(response.status).toBe(200);
  });

  it("skips rate limit for non-API routes", async () => {
    // /map is protected — redirects to login (307), not blocked with 400 or 429
    const response = await middleware(makeRequest("/map/nearby"));
    expect(response.status).toBe(307);
  });

  it("returns 429 with correct headers after limit exceeded", async () => {
    const ip = "5.5.5.5";
    for (let i = 0; i < 3; i++) {
      await middleware(makeRequest("/api/test", { "x-real-ip": ip }));
    }
    const blocked = await middleware(makeRequest("/api/test", { "x-real-ip": ip }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(blocked.headers.get("X-RateLimit-Limit")).toBeDefined();
    expect(blocked.headers.get("Retry-After")).toBeDefined();
  });
});

describe("middleware — auth protection", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
  });

  it("passes public routes through without auth check", async () => {
    mockUnauthenticated();
    const response = await middleware(makeRequest("/"));
    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated user to /login on protected route", async () => {
    mockUnauthenticated();
    const response = await middleware(makeRequest("/map/nearby"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects authenticated user with wrong role to /", async () => {
    mockAuthenticatedAs("user-1", "store");
    const response = await middleware(makeRequest("/map/nearby")); // requires 'client'
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/^http:\/\/localhost\/$/);
  });

  it("redirects when appUser record not found", async () => {
    mockAuthenticatedNoAppUser("user-1");
    const response = await middleware(makeRequest("/store/dashboard")); // requires 'store'
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/^http:\/\/localhost\/$/);
  });

  it("passes through when user has correct role", async () => {
    mockAuthenticatedAs("user-1", "client");
    const response = await middleware(makeRequest("/map/nearby"));
    expect(response.status).toBe(200);
  });

  it("passes store user to /store routes", async () => {
    mockAuthenticatedAs("user-2", "store");
    const response = await middleware(makeRequest("/store/dashboard"));
    expect(response.status).toBe(200);
  });

  it("passes admin user to /admin routes", async () => {
    mockAuthenticatedAs("user-3", "admin");
    const response = await middleware(makeRequest("/admin/dashboard"));
    expect(response.status).toBe(200);
  });
});
