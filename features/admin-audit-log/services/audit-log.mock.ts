import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";
import { auditLogResultSchema } from "@/features/admin-audit-log/schemas/audit-log.schemas";
import { AUDIT_LOG_MOCK_DELAY_MS } from "@/features/admin-audit-log/constants/audit-log.constants";
import type { AuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";
import { logger } from "@/shared/utils/logger";

export interface AuditLogService {
  findByOrderId(orderId: string): Promise<AuditLogResult | null>;
}

const SEED_ORDERS: Record<string, AuditLogResult> = {
  "order-demo-completed": auditLogResultSchema.parse({
    orderId: "order-demo-completed",
    entries: [
      {
        eventType: ORDER_EVENT.SISTEMA_RECIBE,
        newStatus: ORDER_STATUS.RECIBIDO,
        actor: ORDER_ACTOR.SISTEMA,
        occurredAt: new Date("2024-06-01T14:00:00Z"),
      },
      {
        eventType: ORDER_EVENT.TIENDA_ACEPTA,
        newStatus: ORDER_STATUS.ACEPTADO,
        actor: ORDER_ACTOR.TIENDA,
        occurredAt: new Date("2024-06-01T14:03:00Z"),
      },
      {
        eventType: ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO,
        newStatus: ORDER_STATUS.EN_CAMINO,
        actor: ORDER_ACTOR.CLIENTE,
        occurredAt: new Date("2024-06-01T14:10:00Z"),
      },
      {
        eventType: ORDER_EVENT.TIENDA_FINALIZA,
        newStatus: ORDER_STATUS.FINALIZADO,
        actor: ORDER_ACTOR.TIENDA,
        occurredAt: new Date("2024-06-01T14:20:00Z"),
      },
    ],
  }),
  "order-demo-rejected": auditLogResultSchema.parse({
    orderId: "order-demo-rejected",
    entries: [
      {
        eventType: ORDER_EVENT.SISTEMA_RECIBE,
        newStatus: ORDER_STATUS.RECIBIDO,
        actor: ORDER_ACTOR.SISTEMA,
        occurredAt: new Date("2024-06-02T09:00:00Z"),
      },
      {
        eventType: ORDER_EVENT.TIENDA_RECHAZA,
        newStatus: ORDER_STATUS.RECHAZADO,
        actor: ORDER_ACTOR.TIENDA,
        occurredAt: new Date("2024-06-02T09:04:00Z"),
      },
    ],
  }),
  "order-demo-expired": auditLogResultSchema.parse({
    orderId: "order-demo-expired",
    entries: [
      {
        eventType: ORDER_EVENT.SISTEMA_RECIBE,
        newStatus: ORDER_STATUS.RECIBIDO,
        actor: ORDER_ACTOR.SISTEMA,
        occurredAt: new Date("2024-06-03T18:00:00Z"),
      },
      {
        eventType: ORDER_EVENT.SISTEMA_EXPIRA,
        newStatus: ORDER_STATUS.EXPIRADO,
        actor: ORDER_ACTOR.SISTEMA,
        occurredAt: new Date("2024-06-03T18:10:00Z"),
      },
    ],
  }),
  "order-demo-cancelled": auditLogResultSchema.parse({
    orderId: "order-demo-cancelled",
    entries: [
      {
        eventType: ORDER_EVENT.SISTEMA_RECIBE,
        newStatus: ORDER_STATUS.RECIBIDO,
        actor: ORDER_ACTOR.SISTEMA,
        occurredAt: new Date("2024-06-04T11:00:00Z"),
      },
      {
        eventType: ORDER_EVENT.CLIENTE_CANCELA,
        newStatus: ORDER_STATUS.CANCELADO,
        actor: ORDER_ACTOR.CLIENTE,
        occurredAt: new Date("2024-06-04T11:02:00Z"),
      },
    ],
  }),
};

function simulateDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, AUDIT_LOG_MOCK_DELAY_MS));
}

export const auditLogService: AuditLogService = {
  async findByOrderId(orderId: string): Promise<AuditLogResult | null> {
    await simulateDelay();

    const result = SEED_ORDERS[orderId];

    if (!result) {
      logger.info("audit-log: order not found in mock store", { orderId });
      return null;
    }

    const parsed = auditLogResultSchema.safeParse(result);

    if (!parsed.success) {
      logger.error("audit-log: invalid mock data for order", {
        orderId,
        issues: parsed.error.issues,
      });
      return null;
    }

    return parsed.data;
  },
};
