// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockUpsertByEndpoint = vi.fn();

vi.mock("@/shared/repositories/supabase/push-subscriptions.supabase", () => ({
  SupabasePushSubscriptionRepository: vi.fn(function () {
    return { upsertByEndpoint: mockUpsertByEndpoint };
  }),
}));

function makeUsersQueryBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  return builder;
}

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
  ),
}));

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
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

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
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
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: null, error: { message: "not found" } }),
    );
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
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    const subscriptionRow = {
      id: "1",
      endpoint: "https://push.example.com/sub/abc",
      createdAt: "2026-04-28T00:00:00Z",
      updatedAt: "2026-04-28T00:00:00Z",
    };
    mockUpsertByEndpoint.mockResolvedValue(subscriptionRow);
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

  it("returns 500 when repo throws", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockUpsertByEndpoint.mockRejectedValue(new Error("db error"));
    const { POST } = await import("./route");
    const response = await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(response.status).toBe(500);
  });

  it("passes userId as UUID string from users row", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockUpsertByEndpoint.mockResolvedValue({
      id: "1",
      endpoint: "https://push.example.com/sub/abc",
    });
    const { POST } = await import("./route");
    await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(mockUpsertByEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "pub-uuid-123" }),
    );
  });

  it("passes userAgent as undefined when not provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockUpsertByEndpoint.mockResolvedValue({
      id: "1",
      endpoint: "https://push.example.com/sub/abc",
    });
    const { POST } = await import("./route");
    await POST(
      makeRequest({
        endpoint: "https://push.example.com/sub/abc",
        keys: { p256dh: "p256dh-key", auth: "auth-key" },
      }),
    );
    expect(mockUpsertByEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: undefined }),
    );
  });
});
