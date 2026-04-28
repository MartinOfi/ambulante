import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAppend, mockPublish, mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockPublish: vi.fn(),
  mockAppend: vi.fn(),
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

vi.mock("@/shared/repositories/supabase/audit-log.supabase", () => ({
  // Regular function required — arrow functions cannot be called with `new`.
  SupabaseAuditLogService: vi.fn(function () {
    return { append: mockAppend, findByOrderId: vi.fn() };
  }),
}));

vi.mock("@/shared/domain/event-bus", () => ({
  eventBus: {
    publish: mockPublish,
    subscribe: vi.fn(),
    registerSerializationHook: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { ORDER_EXPIRATION_MINUTES } from "@/shared/constants/order";
import { POST } from "./route";

const VALID_TOKEN = "Bearer test-cron-secret-min-16";

function makeRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/expire-orders", {
    method: "POST",
    headers: authHeader !== undefined ? { Authorization: authHeader } : {},
  });
}

interface ClaimRow {
  order_public_id: string;
  old_status: "enviado" | "recibido";
  client_public_id: string;
  store_public_id: string;
  sent_at: string;
}

function makeRow(oldStatus: "enviado" | "recibido" = "enviado"): ClaimRow {
  return {
    order_public_id: crypto.randomUUID(),
    old_status: oldStatus,
    client_public_id: crypto.randomUUID(),
    store_public_id: crypto.randomUUID(),
    sent_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  };
}

describe("POST /api/cron/expire-orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppend.mockResolvedValue(undefined);
  });

  describe("authentication", () => {
    it("returns 401 when Authorization header is absent", async () => {
      const res = await POST(makeRequest());
      expect(res.status).toBe(401);
    });

    it("returns 401 when token is wrong", async () => {
      const res = await POST(makeRequest("Bearer wrong-token"));
      expect(res.status).toBe(401);
    });
  });

  describe("RPC error handling", () => {
    it("returns 500 when claim_expirable_orders RPC fails", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "connection refused" } });
      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(500);
    });
  });

  describe("expiration logic", () => {
    it("returns count 0 and emits no events when no orders are expirable", async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 0, auditFailures: 0 });
      expect(mockPublish).not.toHaveBeenCalled();
    });

    it("calls RPC with ORDER_EXPIRATION_MINUTES", async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      await POST(makeRequest(VALID_TOKEN));
      expect(mockRpc).toHaveBeenCalledWith("claim_expirable_orders", {
        p_expiration_minutes: ORDER_EXPIRATION_MINUTES,
      });
    });

    it("expires a single ENVIADO order and emits ORDER_EXPIRED with correct fields", async () => {
      const row = makeRow("enviado");
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 1, auditFailures: 0 });

      expect(mockPublish).toHaveBeenCalledOnce();
      const event = mockPublish.mock.calls[0][0];
      expect(event.type).toBe("ORDER_EXPIRED");
      expect(event.orderId).toBe(row.order_public_id);
      expect(event.clientId).toBe(row.client_public_id);
      expect(event.storeId).toBe(row.store_public_id);
      expect(event.sentAt).toEqual(new Date(row.sent_at));
      expect(event.expiredAt).toBeInstanceOf(Date);
    });

    it("expires a single RECIBIDO order and emits ORDER_EXPIRED", async () => {
      const row = makeRow("recibido");
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 1, auditFailures: 0 });
      expect(mockPublish.mock.calls[0][0].type).toBe("ORDER_EXPIRED");
    });

    it("appends one audit log entry per expired order", async () => {
      const rows = [makeRow("enviado"), makeRow("recibido")];
      mockRpc.mockResolvedValue({ data: rows, error: null });

      await POST(makeRequest(VALID_TOKEN));
      expect(mockAppend).toHaveBeenCalledTimes(2);
    });

    it("counts auditFailures when audit log append throws", async () => {
      const rows = [makeRow("enviado"), makeRow("recibido")];
      mockRpc.mockResolvedValue({ data: rows, error: null });
      mockAppend.mockRejectedValue(new Error("db unavailable"));

      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 2, auditFailures: 2 });
      expect(mockPublish).toHaveBeenCalledTimes(2);
    });

    it("publishes all events after all audit entries are written (post-commit ordering)", async () => {
      const rows = [makeRow("enviado"), makeRow("recibido")];
      mockRpc.mockResolvedValue({ data: rows, error: null });

      const callLog: string[] = [];
      mockAppend.mockImplementation(async () => {
        callLog.push("audit");
      });
      mockPublish.mockImplementation(() => {
        callLog.push("publish");
      });

      await POST(makeRequest(VALID_TOKEN));

      const lastAuditIdx = callLog.lastIndexOf("audit");
      const firstPublishIdx = callLog.indexOf("publish");
      expect(lastAuditIdx).toBeGreaterThanOrEqual(0);
      expect(firstPublishIdx).toBeGreaterThan(lastAuditIdx);
    });
  });

  describe("concurrent load (100 orders)", () => {
    it("processes 100 mixed ENVIADO/RECIBIDO orders and returns count 100", async () => {
      const rows = Array.from({ length: 100 }, (_, i) =>
        makeRow(i % 2 === 0 ? "enviado" : "recibido"),
      );
      mockRpc.mockResolvedValue({ data: rows, error: null });

      const res = await POST(makeRequest(VALID_TOKEN));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 100, auditFailures: 0 });
      expect(mockPublish).toHaveBeenCalledTimes(100);
      expect(mockAppend).toHaveBeenCalledTimes(100);
    });
  });
});
