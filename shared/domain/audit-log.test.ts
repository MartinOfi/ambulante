import { describe, expect, it } from "vitest";
import {
  auditLogEntrySchema,
  newAuditLogEntrySchema,
  type AuditLogEntry,
  type NewAuditLogEntry,
} from "@/shared/domain/audit-log";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";

const OCCURRED_AT = new Date("2026-01-01T10:05:00Z");

const validEntry: AuditLogEntry = {
  id: "entry-uuid-1",
  orderId: "order-1",
  actor: ORDER_ACTOR.SISTEMA,
  eventType: ORDER_EVENT.SISTEMA_RECIBE,
  fromStatus: ORDER_STATUS.ENVIADO,
  toStatus: ORDER_STATUS.RECIBIDO,
  occurredAt: OCCURRED_AT,
};

const validNewEntry: NewAuditLogEntry = {
  orderId: "order-1",
  actor: ORDER_ACTOR.SISTEMA,
  eventType: ORDER_EVENT.SISTEMA_RECIBE,
  fromStatus: ORDER_STATUS.ENVIADO,
  toStatus: ORDER_STATUS.RECIBIDO,
  occurredAt: OCCURRED_AT,
};

describe("auditLogEntrySchema", () => {
  it("parses a valid entry", () => {
    const parsed = auditLogEntrySchema.safeParse(validEntry);
    expect(parsed.success).toBe(true);
  });

  it("rejects entry with missing id", () => {
    const { id: _id, ...withoutId } = validEntry;
    const parsed = auditLogEntrySchema.safeParse(withoutId);
    expect(parsed.success).toBe(false);
  });

  it("rejects entry with invalid actor", () => {
    const parsed = auditLogEntrySchema.safeParse({ ...validEntry, actor: "UNKNOWN" });
    expect(parsed.success).toBe(false);
  });

  it("rejects entry with invalid fromStatus", () => {
    const parsed = auditLogEntrySchema.safeParse({ ...validEntry, fromStatus: "INVALID" });
    expect(parsed.success).toBe(false);
  });

  it("rejects entry with invalid toStatus", () => {
    const parsed = auditLogEntrySchema.safeParse({ ...validEntry, toStatus: "INVALID" });
    expect(parsed.success).toBe(false);
  });

  it("rejects entry with empty orderId", () => {
    const parsed = auditLogEntrySchema.safeParse({ ...validEntry, orderId: "" });
    expect(parsed.success).toBe(false);
  });
});

describe("newAuditLogEntrySchema", () => {
  it("parses a valid new entry (no id)", () => {
    const parsed = newAuditLogEntrySchema.safeParse(validNewEntry);
    expect(parsed.success).toBe(true);
  });

  it("rejects new entry with id field present (must be server-generated)", () => {
    const parsed = newAuditLogEntrySchema.safeParse({ ...validNewEntry, id: "uuid" });
    expect(parsed.success).toBe(false);
  });

  it("rejects new entry with invalid eventType", () => {
    const parsed = newAuditLogEntrySchema.safeParse({ ...validNewEntry, eventType: "FAKE_EVENT" });
    expect(parsed.success).toBe(false);
  });
});
