import { z } from "zod";
import { ORDER_STATUS } from "@/shared/constants/order";
import { ORDER_ACTOR, ORDER_EVENT } from "@/shared/domain/order-state-machine";

const orderStatusValues = Object.values(ORDER_STATUS) as [string, ...string[]];
const orderActorValues = Object.values(ORDER_ACTOR) as [string, ...string[]];
const orderEventValues = Object.values(ORDER_EVENT) as [string, ...string[]];

export const auditLogEntrySchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  actor: z.enum(orderActorValues),
  eventType: z.enum(orderEventValues),
  fromStatus: z.enum(orderStatusValues),
  toStatus: z.enum(orderStatusValues),
  occurredAt: z.date(),
});

export const newAuditLogEntrySchema = auditLogEntrySchema.omit({ id: true }).strict();

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type NewAuditLogEntry = z.infer<typeof newAuditLogEntrySchema>;
