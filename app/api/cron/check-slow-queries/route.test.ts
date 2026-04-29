// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockReportSlowQuery, mockLoggerWarn, mockLoggerError } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockReportSlowQuery: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock("@/shared/config/env", () => ({
  env: {
    CRON_SECRET: "test-cron-secret-min-16",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

vi.mock("@/shared/repositories/supabase/client", () => ({
  createServiceRoleClient: vi.fn(() => ({ rpc: mockRpc })),
}));

vi.mock("@/shared/utils/sentry", () => ({
  reportSlowQuery: mockReportSlowQuery,
}));

vi.mock("@/shared/utils/server-logger", () => ({
  getOrCreateRequestLogger: vi.fn(() => ({
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: mockLoggerWarn,
      error: mockLoggerError,
      registerErrorHook: vi.fn(),
    },
    requestId: "test-request-id",
  })),
}));

import { POST } from "./route";

const VALID_TOKEN = "Bearer test-cron-secret-min-16";

function makeRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/check-slow-queries", {
    method: "POST",
    headers: authHeader !== undefined ? { Authorization: authHeader } : {},
  });
}

describe("POST /api/cron/check-slow-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when Authorization header is absent", async () => {
      const res = await POST(makeRequest());
      expect(res.status).toBe(401);
    });

    it("returns 401 when token is wrong", async () => {
      const res = await POST(makeRequest("Bearer wrong"));
      expect(res.status).toBe(401);
    });
  });

  describe("RPC error handling", () => {
    it("returns 500 when get_slow_queries_for_alerts RPC fails", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fn missing" } });
      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(500);
    });

    it("returns 500 when RPC response has unexpected shape", async () => {
      mockRpc.mockResolvedValue({ data: [{ wrong_shape: true }], error: null });
      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(500);
    });
  });

  describe("happy path", () => {
    it("emits 0 alerts and returns count=0 when no breaches", async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(0);
      expect(body.alerted).toBe(0);
      expect(mockReportSlowQuery).not.toHaveBeenCalled();
    });

    it("emits 1 alert per breach and returns count + alerted", async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            queryid: "-8526132273240596864",
            mean_exec_time_ms: 4564.44,
            calls: 100,
            total_exec_time_ms: 456444,
            query_text: "select * from orders where status = $1",
            baseline_mean_ms: null,
            breach_kind: "absolute",
          },
          {
            queryid: "12345",
            mean_exec_time_ms: 200.0,
            calls: 5000,
            total_exec_time_ms: 1000000,
            query_text: "select * from products limit 100",
            baseline_mean_ms: 80.0,
            breach_kind: "absolute_and_regression",
          },
        ],
        error: null,
      });

      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(2);
      expect(body.alerted).toBe(2);
      expect(body.requestId).toBe("test-request-id");

      expect(mockReportSlowQuery).toHaveBeenCalledTimes(2);
      expect(mockReportSlowQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryid: "-8526132273240596864",
          breachKind: "absolute",
          requestId: "test-request-id",
        }),
      );
    });

    it("truncates very long query text before reporting", async () => {
      const longQuery = "select ".concat("x, ".repeat(500), "from t");
      mockRpc.mockResolvedValue({
        data: [
          {
            queryid: "1",
            mean_exec_time_ms: 150.0,
            calls: 10,
            total_exec_time_ms: 1500,
            query_text: longQuery,
            baseline_mean_ms: null,
            breach_kind: "absolute",
          },
        ],
        error: null,
      });

      await POST(makeRequest(VALID_TOKEN));
      const call = mockReportSlowQuery.mock.calls[0][0];
      expect(call.queryText.length).toBeLessThanOrEqual(500);
      expect(call.queryText.endsWith("…")).toBe(true);
    });
  });

  describe("missing config", () => {
    it("returns 503 when CRON_SECRET is not configured", async () => {
      vi.resetModules();
      vi.doMock("@/shared/config/env", () => ({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
        },
      }));
      const { POST: PostNoSecret } = await import("./route");
      const res = await PostNoSecret(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(503);
      vi.doUnmock("@/shared/config/env");
    });
  });
});
