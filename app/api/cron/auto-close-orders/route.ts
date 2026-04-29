import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { ORDER_DOMAIN_EVENT, type OrderFinishedDomainEvent } from "@/shared/domain/events";
import { eventBus } from "@/shared/domain/event-bus";
import {
  ORDER_ACTOR,
  ORDER_EVENT,
  transitionWithAudit,
  type OrderAceptado,
} from "@/shared/domain/order-state-machine";
import { env } from "@/shared/config/env";
import { ORDER_AUTOCLOSE_HOURS, ORDER_STATUS } from "@/shared/constants/order";
import { SupabaseAuditLogService } from "@/shared/repositories/supabase/audit-log.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { logger } from "@/shared/utils/logger";
import type { AuditLogService } from "@/shared/services/audit-log";

const ClaimRowSchema = z.object({
  order_public_id: z.string().uuid(),
  client_public_id: z.string().uuid(),
  store_public_id: z.string().uuid(),
  sent_at: z.string().datetime(),
  accepted_at: z.string().datetime(),
});

type ClaimRow = z.infer<typeof ClaimRowSchema>;

function buildOrderForTransition(row: ClaimRow): OrderAceptado {
  // DB proxy: updated_at at status=aceptado doubles as both receivedAt and acceptedAt
  const acceptedAt = new Date(row.accepted_at);
  return {
    id: row.order_public_id,
    clientId: row.client_public_id,
    storeId: row.store_public_id,
    sentAt: new Date(row.sent_at),
    status: ORDER_STATUS.ACEPTADO,
    receivedAt: acceptedAt,
    acceptedAt,
  };
}

interface ProcessResult {
  readonly event: OrderFinishedDomainEvent | null;
  readonly auditFailed: boolean;
}

async function processClaimRow(
  row: ClaimRow,
  closedAt: Date,
  auditLog: AuditLogService,
): Promise<ProcessResult> {
  const order = buildOrderForTransition(row);
  const result = await transitionWithAudit({
    order,
    event: { type: ORDER_EVENT.SISTEMA_AUTO_CIERRA, occurredAt: closedAt },
    actor: ORDER_ACTOR.SISTEMA,
    auditLog,
  });

  if (!result.ok) {
    logger.error("auto-close-orders: unexpected transition failure", {
      orderId: row.order_public_id,
      error: result.error,
    });
    return { event: null, auditFailed: false };
  }

  const finished = result.value;
  if (finished.status !== ORDER_STATUS.FINALIZADO) {
    logger.error("auto-close-orders: unexpected status after transition", {
      orderId: row.order_public_id,
      status: finished.status,
    });
    return { event: null, auditFailed: result.auditFailed ?? false };
  }

  return {
    event: {
      type: ORDER_DOMAIN_EVENT.ORDER_FINISHED,
      orderId: finished.id,
      clientId: finished.clientId,
      storeId: finished.storeId,
      occurredAt: closedAt,
      sentAt: finished.sentAt,
      receivedAt: finished.receivedAt,
      acceptedAt: finished.acceptedAt,
      onTheWayAt: finished.onTheWayAt,
      finishedAt: finished.finishedAt,
    },
    auditFailed: result.auditFailed ?? false,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cronSecret = env.CRON_SECRET;
  if (cronSecret === undefined) {
    logger.error("auto-close-orders: CRON_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined || serviceRoleKey === undefined) {
    logger.error("auto-close-orders: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const auditLog = new SupabaseAuditLogService(client);

  const { data, error: rpcError } = await client.rpc("claim_auto_closeable_orders", {
    p_autoclose_hours: ORDER_AUTOCLOSE_HOURS,
  });

  if (rpcError !== null) {
    logger.error("auto-close-orders: claim_auto_closeable_orders RPC failed", { error: rpcError });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const parseResult = ClaimRowSchema.array().safeParse(data ?? []);
  if (!parseResult.success) {
    logger.error("auto-close-orders: unexpected RPC response shape", { error: parseResult.error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  const rows = parseResult.data;
  const closedAt = new Date();
  const domainEvents: OrderFinishedDomainEvent[] = [];
  let auditFailures = 0;

  for (const row of rows) {
    const { event, auditFailed } = await processClaimRow(row, closedAt, auditLog);
    if (auditFailed) auditFailures += 1;
    if (event !== null) domainEvents.push(event);
  }

  for (const event of domainEvents) {
    eventBus.publish(event);
  }

  return NextResponse.json({ count: domainEvents.length, auditFailures });
}
