// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockFindByEndpoint = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/shared/repositories/supabase/push-subscriptions.supabase", () => ({
  SupabasePushSubscriptionRepository: vi.fn(function () {
    return { findByEndpoint: mockFindByEndpoint, delete: mockDelete };
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

describe("DELETE /api/push/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function makeRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/push/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 when body is not valid JSON", async () => {
    const { DELETE } = await import("./route");
    const request = new NextRequest("http://localhost/api/push/unsubscribe", {
      method: "DELETE",
      body: "not-json",
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when endpoint is missing", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 when endpoint is not a URL", async () => {
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "not-a-url" }));
    expect(response.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(401);
  });

  it("returns 404 when user has no public.users row", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: null, error: { message: "not found" } }),
    );
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 404 when subscription does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockFindByEndpoint.mockResolvedValue(null);
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 404 when subscription belongs to a different user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockFindByEndpoint.mockResolvedValue({
      id: "99",
      userId: "other-user-uuid",
      endpoint: "https://push.example.com/sub/abc",
    });
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 204 when subscription is successfully deleted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockFindByEndpoint.mockResolvedValue({
      id: "99",
      userId: "pub-uuid-123",
      endpoint: "https://push.example.com/sub/abc",
    });
    mockDelete.mockResolvedValue(undefined);
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(204);
  });

  it("returns 500 when repo throws during findByEndpoint", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockFindByEndpoint.mockRejectedValue(new Error("db error"));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(500);
  });

  it("calls delete with sub.id for ownership enforcement", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockFrom.mockReturnValue(
      makeUsersQueryBuilder({ data: { public_id: "pub-uuid-123" }, error: null }),
    );
    mockFindByEndpoint.mockResolvedValue({
      id: "99",
      userId: "pub-uuid-123",
      endpoint: "https://push.example.com/sub/abc",
    });
    mockDelete.mockResolvedValue(undefined);
    const { DELETE } = await import("./route");
    await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(mockDelete).toHaveBeenCalledWith("99");
  });
});
