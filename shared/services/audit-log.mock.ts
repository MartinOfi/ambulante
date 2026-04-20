import type { AuditLogService } from "@/shared/services/audit-log";
import type { AuditLogEntry, NewAuditLogEntry } from "@/shared/domain/audit-log";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";

const MOCK_DELAY_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `audit-mock-${idCounter}`;
}

const SEED_ENTRIES: AuditLogEntry[] = [
  // order-demo-completed: full happy path
  {
    id: "seed-c1",
    orderId: "order-demo-completed",
    actor: ORDER_ACTOR.SISTEMA,
    eventType: ORDER_EVENT.SISTEMA_RECIBE,
    fromStatus: ORDER_STATUS.ENVIADO,
    toStatus: ORDER_STATUS.RECIBIDO,
    occurredAt: new Date("2026-04-01T09:00:30Z"),
  },
  {
    id: "seed-c2",
    orderId: "order-demo-completed",
    actor: ORDER_ACTOR.TIENDA,
    eventType: ORDER_EVENT.TIENDA_ACEPTA,
    fromStatus: ORDER_STATUS.RECIBIDO,
    toStatus: ORDER_STATUS.ACEPTADO,
    occurredAt: new Date("2026-04-01T09:02:00Z"),
  },
  {
    id: "seed-c3",
    orderId: "order-demo-completed",
    actor: ORDER_ACTOR.CLIENTE,
    eventType: ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO,
    fromStatus: ORDER_STATUS.ACEPTADO,
    toStatus: ORDER_STATUS.EN_CAMINO,
    occurredAt: new Date("2026-04-01T09:10:00Z"),
  },
  {
    id: "seed-c4",
    orderId: "order-demo-completed",
    actor: ORDER_ACTOR.TIENDA,
    eventType: ORDER_EVENT.TIENDA_FINALIZA,
    fromStatus: ORDER_STATUS.EN_CAMINO,
    toStatus: ORDER_STATUS.FINALIZADO,
    occurredAt: new Date("2026-04-01T09:25:00Z"),
  },

  // order-demo-rejected: store rejects
  {
    id: "seed-r1",
    orderId: "order-demo-rejected",
    actor: ORDER_ACTOR.SISTEMA,
    eventType: ORDER_EVENT.SISTEMA_RECIBE,
    fromStatus: ORDER_STATUS.ENVIADO,
    toStatus: ORDER_STATUS.RECIBIDO,
    occurredAt: new Date("2026-04-02T11:00:30Z"),
  },
  {
    id: "seed-r2",
    orderId: "order-demo-rejected",
    actor: ORDER_ACTOR.TIENDA,
    eventType: ORDER_EVENT.TIENDA_RECHAZA,
    fromStatus: ORDER_STATUS.RECIBIDO,
    toStatus: ORDER_STATUS.RECHAZADO,
    occurredAt: new Date("2026-04-02T11:03:00Z"),
  },

  // order-demo-expired: system expires
  {
    id: "seed-e1",
    orderId: "order-demo-expired",
    actor: ORDER_ACTOR.SISTEMA,
    eventType: ORDER_EVENT.SISTEMA_RECIBE,
    fromStatus: ORDER_STATUS.ENVIADO,
    toStatus: ORDER_STATUS.RECIBIDO,
    occurredAt: new Date("2026-04-03T14:00:30Z"),
  },
  {
    id: "seed-e2",
    orderId: "order-demo-expired",
    actor: ORDER_ACTOR.SISTEMA,
    eventType: ORDER_EVENT.SISTEMA_EXPIRA,
    fromStatus: ORDER_STATUS.RECIBIDO,
    toStatus: ORDER_STATUS.EXPIRADO,
    occurredAt: new Date("2026-04-03T14:10:30Z"),
  },

  // order-demo-cancelled: client cancels before acceptance
  {
    id: "seed-ca1",
    orderId: "order-demo-cancelled",
    actor: ORDER_ACTOR.SISTEMA,
    eventType: ORDER_EVENT.SISTEMA_RECIBE,
    fromStatus: ORDER_STATUS.ENVIADO,
    toStatus: ORDER_STATUS.RECIBIDO,
    occurredAt: new Date("2026-04-04T16:00:30Z"),
  },
  {
    id: "seed-ca2",
    orderId: "order-demo-cancelled",
    actor: ORDER_ACTOR.CLIENTE,
    eventType: ORDER_EVENT.CLIENTE_CANCELA,
    fromStatus: ORDER_STATUS.RECIBIDO,
    toStatus: ORDER_STATUS.CANCELADO,
    occurredAt: new Date("2026-04-04T16:01:30Z"),
  },
];

export function createMockAuditLogService(): AuditLogService {
  const entries: AuditLogEntry[] = [...SEED_ENTRIES];

  async function append(entry: NewAuditLogEntry): Promise<void> {
    await delay(MOCK_DELAY_MS);
    entries.push({ ...entry, id: nextId() });
  }

  async function findByOrderId(orderId: string): Promise<readonly AuditLogEntry[]> {
    await delay(MOCK_DELAY_MS);
    return entries
      .filter((e) => e.orderId === orderId)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }

  return { append, findByOrderId };
}

export const auditLogService: AuditLogService = createMockAuditLogService();
