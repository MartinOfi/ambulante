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

function makeDeleteBuilder(result: { data?: unknown[] | null; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  // Simulate `.select('id')` returning count of deleted rows
  builder.select = vi.fn().mockResolvedValue(result);
  return builder;
}

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  })),
}));

describe("DELETE /api/push/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns 401 when session is missing", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(401);
  });

  it("returns 404 when subscription does not exist", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: [], error: null }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(404);
  });

  it("returns 204 when subscription is successfully deleted", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: [{ id: 1 }], error: null }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(204);
  });

  it("returns 500 when database delete fails", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    mockFrom.mockReturnValue(makeDeleteBuilder({ data: null, error: { message: "db error" } }));
    const { DELETE } = await import("./route");
    const response = await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(response.status).toBe(500);
  });

  it("deletes by endpoint and RLS restricts to own rows", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-uuid" } } } });
    const builder = makeDeleteBuilder({ data: [{ id: 1 }], error: null });
    mockFrom.mockReturnValue(builder);
    const { DELETE } = await import("./route");
    await DELETE(makeRequest({ endpoint: "https://push.example.com/sub/abc" }));
    expect(builder.eq).toHaveBeenCalledWith("endpoint", "https://push.example.com/sub/abc");
  });
});
