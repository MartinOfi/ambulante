import { z } from "zod";
import { AUDIT_LOG_MAX_ORDER_ID_LENGTH } from "@/features/admin-audit-log/constants/audit-log.constants";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";

export const orderIdSearchSchema = z.object({
  orderId: z
    .string()
    .trim()
    .min(1, { message: "Ingresá el id del pedido." })
    .max(AUDIT_LOG_MAX_ORDER_ID_LENGTH, {
      message: `El id es demasiado largo (máximo ${AUDIT_LOG_MAX_ORDER_ID_LENGTH} caracteres).`,
    }),
});

export const auditLogActorSchema = z.nativeEnum(ORDER_ACTOR);

export const auditLogStatusSchema = z.nativeEnum(ORDER_STATUS);

export const auditLogEventTypeSchema = z.nativeEnum(ORDER_EVENT);

export const auditLogEntrySchema = z.object({
  eventType: auditLogEventTypeSchema,
  newStatus: auditLogStatusSchema,
  actor: auditLogActorSchema,
  occurredAt: z.date(),
});

export const auditLogResultSchema = z.object({
  orderId: z.string().min(1),
  entries: z.array(auditLogEntrySchema),
});
