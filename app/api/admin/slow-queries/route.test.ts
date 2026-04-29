// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
    }),
  ),
}));

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/admin/slow-queries", { method: "GET" });
}

describe("GET /api/admin/slow-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 401 when session has no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 401 when getUser returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "jwt expired" } });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated user is not admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
    mockRpc.mockResolvedValue({ data: false, error: null });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 500 when is_admin RPC fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-uuid" } }, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "rpc error" } });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });

  it("returns 200 with slow queries data when user is admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-uuid" } }, error: null });
    mockRpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({
      data: [
        {
          calls: 100,
          total_exec_time_ms: 5000.25,
          mean_exec_time_ms: 50.0,
          query_text: "select * from orders",
        },
      ],
      error: null,
    });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      calls: 100,
      totalExecTimeMs: 5000.25,
      meanExecTimeMs: 50.0,
      queryText: "select * from orders",
    });
  });

  it("returns 500 when get_top_slow_queries RPC fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-uuid" } }, error: null });
    mockRpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "pg_stat_statements not enabled" } });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });

  it("returns empty data array when no slow queries exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-uuid" } }, error: null });
    mockRpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual([]);
  });

  it("returns 500 when response data fails schema validation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-uuid" } }, error: null });
    mockRpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({
      data: [
        {
          calls: "not-a-number",
          total_exec_time_ms: 100,
          mean_exec_time_ms: 10,
          query_text: "select 1",
        },
      ],
      error: null,
    });
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });
});
