// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

function makeDeleteBuilder(result: { data?: unknown[] | null; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.select = vi.fn().mockResolvedValue(result);
  return builder;
}

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
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
    mockRpc.mockResolvedValue({ data: null, error: null });
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 404 when subscription does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: [], error: null }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 204 when subscription is successfully deleted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: [{ id: 1 }], error: null }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(204);
  });

  it("returns 500 when database delete fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: null, error: { message: "db error" } }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(500);
  });

  it("deletes by endpoint and user_id for ownership enforcement", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-uuid" } }, error: null });
    mockRpc.mockResolvedValue({ data: 42, error: null });
    const builder = makeDeleteBuilder({ data: [{ id: 1 }], error: null });
    mockFrom.mockReturnValue(builder);
    const { DELETE } = await import("./route");
    await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(builder.eq).toHaveBeenCalledWith("endpoint", "https://push.example.com/sub/abc");
    expect(builder.eq).toHaveBeenCalledWith("user_id", 42);
  });
});
