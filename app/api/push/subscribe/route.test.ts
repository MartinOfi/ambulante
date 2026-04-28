// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  },
}));

const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

function makeQueryBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.upsert = vi.fn().mockReturnValue(builder);
  builder.select = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  return builder;
}

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 when body is not valid JSON", async () => {
    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      body: "not-json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when endpoint is missing", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ keys: { p256dh: "abc", auth: "def" } }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when endpoint is not a URL", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({ endpoint: "not-a-url", keys: { p256dh: "abc", auth: "def" } }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when keys are missing", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(400);
  });

  it("returns 401 when session is missing", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when user has no public.users row", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(response.status).toBe(404);
  });

  it("returns 201 with subscription data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    const subscriptionRow = {
      id: 1,
      endpoint: "https://push.example.com/sub/abc",
      created_at: "2026-04-28T00:00:00Z",
      updated_at: "2026-04-28T00:00:00Z",
    };
    mockFrom.mockReturnValue(makeQueryBuilder({ data: subscriptionRow, error: null }));
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
        userAgent: "Mozilla/5.0",
      }),
    );
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual(subscriptionRow);
  });

  it("returns 500 when database upsert fails", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    mockFrom.mockReturnValue(
      makeQueryBuilder({ data: null, error: { code: "23505", message: "duplicate" } }),
    );
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(response.status).toBe(500);
  });

  it("passes userAgent as null when not provided", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    const builder = makeQueryBuilder({
      data: { id: 1, endpoint: "https://push.example.com/sub/abc", created_at: "", updated_at: "" },
      error: null,
    });
    mockFrom.mockReturnValue(builder);
    const { POST } = await import("./route");
    await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_agent: null }),
      expect.any(Object),
    );
  });
});
