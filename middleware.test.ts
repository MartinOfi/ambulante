import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function makeRequest(path: string, headers: Record<string, string> = {}): NextRequest {
  const url = `http://localhost${path}`;
  return new NextRequest(url, { headers });
}

vi.mock("@/shared/services/rate-limit", () => {
  const store = new Map<string, number>();
  return {
    createRateLimitService: () => ({
      check: vi.fn(({ identifier }: { identifier: string }) => {
        const count = (store.get(identifier) ?? 0) + 1;
        store.set(identifier, count);
        return Promise.resolve({
          allowed: count <= 3,
          remaining: Math.max(0, 3 - count),
          resetAtMs: Date.now() + 60_000,
        });
      }),
    }),
  };
});

describe("middleware — applyRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 when no IP header is present on API route", async () => {
    const request = makeRequest("/api/test");
    const response = await middleware(request);
    expect(response.status).toBe(400);
  });

  it("uses x-real-ip header as identifier", async () => {
    const request = makeRequest("/api/test", { "x-real-ip": "1.2.3.4" });
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it("uses the last x-forwarded-for entry, not the first", async () => {
    // First entry is attacker-controlled; last is appended by the trusted proxy.
    const request = makeRequest("/api/test", {
      "x-forwarded-for": "attacker-ip, trusted-proxy-ip",
    });
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it("prefers x-real-ip over x-forwarded-for", async () => {
    const request = makeRequest("/api/test", {
      "x-real-ip": "real-ip",
      "x-forwarded-for": "other-ip",
    });
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it("passes non-API routes through without IP check", async () => {
    // /map route: no IP header, but should not be rate-limited (auth check only)
    const request = makeRequest("/map/nearby");
    const response = await middleware(request);
    // Auth redirects since no session — 307, not 400 or 429
    expect(response.status).toBe(307);
  });

  it("returns 429 with correct headers when limit exceeded", async () => {
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
