import { describe, it, expect, beforeEach } from "vitest";
import { SupabaseAuditLogService } from "./audit-log.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeAuditRow = (overrides = {}) => ({
  id: 1,
  created_at: "2026-04-28T10:00:00Z",
  new_values: {
    orderId: "order-uuid",
    actor: "TIENDA",
    eventType: "TIENDA_ACEPTA",
    fromStatus: "RECIBIDO",
    toStatus: "ACEPTADO",
    occurredAt: "2026-04-28T10:00:00Z",
  },
  ...overrides,
});

describe("SupabaseAuditLogService", () => {
  let service: SupabaseAuditLogService;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    service = new SupabaseAuditLogService(mocks.client);
    queryMock = mocks.queryMock;
  });

  describe("append", () => {
    it("resolves order UUID then inserts domain fields in new_values", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 5 }, error: null }); // resolveOrderInternalId
      queryMock.insert.mockResolvedValueOnce({ data: null, error: null });

      const occurredAt = new Date("2026-04-28T10:00:00Z");
      await service.append({
        orderId: "order-uuid",
        actor: "TIENDA",
        eventType: "TIENDA_ACEPTA",
        fromStatus: "RECIBIDO",
        toStatus: "ACEPTADO",
        occurredAt,
      });

      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          table_name: "orders",
          operation: "UPDATE",
          row_id: 5,
          new_values: expect.objectContaining({
            orderId: "order-uuid",
            actor: "TIENDA",
            fromStatus: "RECIBIDO",
            toStatus: "ACEPTADO",
          }),
        }),
      );
    });

    it("throws on Supabase insert error", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 5 }, error: null });
      queryMock.insert.mockResolvedValueOnce({ data: null, error: { message: "insert failed" } });
      await expect(
        service.append({
          orderId: "order-uuid",
          actor: "SISTEMA",
          eventType: "SISTEMA_EXPIRA",
          fromStatus: "ENVIADO",
          toStatus: "EXPIRADO",
          occurredAt: new Date(),
        }),
      ).rejects.toThrow("insert failed");
    });
  });

  describe("findByOrderId", () => {
    it("resolves UUID then queries audit_log filtered by table_name and row_id", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 5 }, error: null });
      queryMock.order.mockResolvedValueOnce({ data: [makeAuditRow()], error: null });

      const entries = await service.findByOrderId("order-uuid");
      expect(entries).toHaveLength(1);
      expect(entries[0].actor).toBe("TIENDA");
      expect(entries[0].fromStatus).toBe("RECIBIDO");
      expect(entries[0].toStatus).toBe("ACEPTADO");
      expect(entries[0].occurredAt).toBeInstanceOf(Date);
    });

    it("filters out rows with incomplete new_values", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 5 }, error: null });
      const incompleteRow = {
        id: 2,
        created_at: "2026-04-28T10:00:00Z",
        new_values: { orderId: "o1" },
      };
      queryMock.order.mockResolvedValueOnce({ data: [incompleteRow], error: null });

      const entries = await service.findByOrderId("order-uuid");
      expect(entries).toHaveLength(0);
    });

    it("throws when order UUID not found", async () => {
      queryMock.single.mockResolvedValueOnce({ data: null, error: { message: "not found" } });
      await expect(service.findByOrderId("ghost")).rejects.toThrow("not found");
    });
  });
});
