import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";
import type { AuditLogEntry as DomainAuditLogEntry } from "@/shared/domain/audit-log";

// ── Shared mock state ──────────────────────────────────────────────────────────

interface MockState {
  authUser: { id: string } | null;
  domainEntries: readonly DomainAuditLogEntry[];
  findShouldThrow: Error | null;
}

const state: MockState = {
  authUser: { id: "auth-user-uuid" },
  domainEntries: [],
  findShouldThrow: null,
};

const findByOrderIdMock = vi.fn(async (_orderId: string) => {
  if (state.findShouldThrow !== null) throw state.findShouldThrow;
  return state.domainEntries;
});

const mockClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.authUser },
      error: null,
    })),
  },
};

vi.mock("@/shared/repositories/supabase/client", () => ({
  createRouteHandlerClient: vi.fn(async () => mockClient),
}));

vi.mock("@/shared/repositories/supabase/audit-log.supabase", () => ({
  SupabaseAuditLogService: class {
    findByOrderId = findByOrderIdMock;
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeDomainEntry(overrides?: Partial<DomainAuditLogEntry>): DomainAuditLogEntry {
  return {
    id: "1",
    orderId: "order-test-uuid",
    actor: ORDER_ACTOR.TIENDA,
    eventType: ORDER_EVENT.TIENDA_ACEPTA,
    fromStatus: ORDER_STATUS.RECIBIDO,
    toStatus: ORDER_STATUS.ACEPTADO,
    occurredAt: new Date("2024-06-01T10:00:00Z"),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("fetchAuditLog", () => {
  beforeEach(() => {
    state.authUser = { id: "auth-user-uuid" };
    state.domainEntries = [];
    state.findShouldThrow = null;
    vi.clearAllMocks();
  });

  it("returns null for empty orderId", async () => {
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("");
    expect(result).toBeNull();
  });

  it("returns null for whitespace-only orderId", async () => {
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("   ");
    expect(result).toBeNull();
  });

  it("returns null when service throws (order not found)", async () => {
    state.findShouldThrow = new Error("order not found");
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("order-test-uuid");
    expect(result).toBeNull();
  });

  it("returns null when service returns no entries", async () => {
    state.domainEntries = [];
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("order-test-uuid");
    expect(result).toBeNull();
  });

  it("maps domain entries to feature schema (toStatus → newStatus)", async () => {
    state.domainEntries = [makeDomainEntry()];
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("order-test-uuid");

    expect(result).not.toBeNull();
    expect(result?.orderId).toBe("order-test-uuid");
    expect(result?.entries).toHaveLength(1);
    const entry = result?.entries[0];
    expect(entry?.eventType).toBe(ORDER_EVENT.TIENDA_ACEPTA);
    expect(entry?.newStatus).toBe(ORDER_STATUS.ACEPTADO);
    expect(entry?.actor).toBe(ORDER_ACTOR.TIENDA);
    expect(entry?.occurredAt).toEqual(new Date("2024-06-01T10:00:00Z"));
  });

  it("maps multiple entries preserving order", async () => {
    state.domainEntries = [
      makeDomainEntry({
        id: "1",
        eventType: ORDER_EVENT.SISTEMA_RECIBE,
        toStatus: ORDER_STATUS.RECIBIDO,
      }),
      makeDomainEntry({
        id: "2",
        eventType: ORDER_EVENT.TIENDA_ACEPTA,
        toStatus: ORDER_STATUS.ACEPTADO,
      }),
    ];
    const { fetchAuditLog } = await import("./fetch-audit-log");
    const result = await fetchAuditLog("order-test-uuid");

    expect(result?.entries).toHaveLength(2);
    expect(result?.entries[0]?.newStatus).toBe(ORDER_STATUS.RECIBIDO);
    expect(result?.entries[1]?.newStatus).toBe(ORDER_STATUS.ACEPTADO);
  });
});
