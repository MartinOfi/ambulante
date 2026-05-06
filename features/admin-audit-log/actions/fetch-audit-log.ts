"use server";

import "server-only";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseAuditLogService } from "@/shared/repositories/supabase/audit-log.supabase";
import { orderIdSearchSchema } from "@/features/admin-audit-log/schemas/audit-log.schemas";
import { serverLogger } from "@/shared/utils/server-logger";
import type { OrderActor, OrderEventType } from "@/shared/domain/order-state-machine";
import type { OrderStatus } from "@/shared/constants/order";
import type { FetchAuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";

export async function fetchAuditLog(orderId: string): Promise<FetchAuditLogResult> {
  const parsed = orderIdSearchSchema.safeParse({ orderId });
  if (!parsed.success) return { status: "not_found" };

  try {
    const client = await createRouteHandlerClient();
    const service = new SupabaseAuditLogService(client);
    const domainEntries = await service.findByOrderId(parsed.data.orderId);

    if (domainEntries.length === 0) return { status: "not_found" };

    return {
      status: "ok",
      data: {
        orderId: parsed.data.orderId,
        entries: domainEntries.map((e) => ({
          // Domain schema widens enum values to string via z.enum([string, ...string[]]).
          // These casts are safe: SupabaseAuditLogService validates the JSONB payload
          // against the same enum values before returning.
          eventType: e.eventType as OrderEventType,
          newStatus: e.toStatus as OrderStatus,
          actor: e.actor as OrderActor,
          occurredAt: e.occurredAt,
        })),
      },
    };
  } catch (error) {
    serverLogger.error("fetchAuditLog failed", { orderId, error });
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { status: "error", message };
  }
}
