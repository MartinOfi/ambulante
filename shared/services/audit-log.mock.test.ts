import { describe, expect, it } from "vitest";
import { createMockAuditLogService } from "@/shared/services/audit-log.mock";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";
import type { NewAuditLogEntry } from "@/shared/domain/audit-log";

const OCCURRED_AT = new Date("2026-01-01T10:05:00Z");

const newEntry: NewAuditLogEntry = {
  orderId: "order-fresh",
  actor: ORDER_ACTOR.SISTEMA,
  eventType: ORDER_EVENT.SISTEMA_RECIBE,
  fromStatus: ORDER_STATUS.ENVIADO,
  toStatus: ORDER_STATUS.RECIBIDO,
  occurredAt: OCCURRED_AT,
};

describe("MockAuditLogService", () => {
  describe("findByOrderId", () => {
    it("returns entries for a seeded completed order", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("order-demo-completed");
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.orderId === "order-demo-completed")).toBe(true);
    });

    it("returns entries for a seeded rejected order", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("order-demo-rejected");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("returns entries for a seeded expired order", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("order-demo-expired");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("returns entries for a seeded cancelled order", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("order-demo-cancelled");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown orderId", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("does-not-exist");
      expect(entries).toEqual([]);
    });

    it("entries are sorted by occurredAt ASC", async () => {
      const service = createMockAuditLogService();
      const entries = await service.findByOrderId("order-demo-completed");
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].occurredAt.getTime()).toBeGreaterThanOrEqual(
          entries[i - 1].occurredAt.getTime(),
        );
      }
    });
  });

  describe("append", () => {
    it("appends an entry and makes it retrievable", async () => {
      const service = createMockAuditLogService();
      await service.append(newEntry);
      const entries = await service.findByOrderId("order-fresh");
      expect(entries).toHaveLength(1);
      expect(entries[0].orderId).toBe("order-fresh");
      expect(entries[0].actor).toBe(ORDER_ACTOR.SISTEMA);
      expect(entries[0].fromStatus).toBe(ORDER_STATUS.ENVIADO);
      expect(entries[0].toStatus).toBe(ORDER_STATUS.RECIBIDO);
    });

    it("assigns a unique id to the appended entry", async () => {
      const service = createMockAuditLogService();
      await service.append(newEntry);
      await service.append({ ...newEntry, orderId: "order-fresh-2" });
      const entries1 = await service.findByOrderId("order-fresh");
      const entries2 = await service.findByOrderId("order-fresh-2");
      expect(entries1[0].id).not.toBe(entries2[0].id);
    });

    it("cannot delete entries (append-only contract)", () => {
      const service = createMockAuditLogService();
      // @ts-expect-error — no delete method on AuditLogService
      expect(service.delete).toBeUndefined();
    });

    it("cannot update entries (append-only contract)", () => {
      const service = createMockAuditLogService();
      // @ts-expect-error — no update method on AuditLogService
      expect(service.update).toBeUndefined();
    });
  });
});
