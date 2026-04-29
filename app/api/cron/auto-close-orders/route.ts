import { type NextRequest, NextResponse } from "next/server";

import { ORDER_DOMAIN_EVENT, type OrderFinishedDomainEvent } from "@/shared/domain/events";
import { eventBus } from "@/shared/domain/event-bus";
import {
  ORDER_ACTOR,
  ORDER_EVENT,
  transitionWithAudit,
  type OrderAceptado,
  type OrderFinalizado,
} from "@/shared/domain/order-state-machine";
import { env } from "@/shared/config/env";
import { ORDER_AUTOCLOSE_HOURS, ORDER_STATUS } from "@/shared/constants/order";
import { SupabaseAuditLogService } from "@/shared/repositories/supabase/audit-log.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { logger } from "@/shared/utils/logger";

interface ClaimRow {
  readonly order_public_id: string;
  readonly client_public_id: string;
  readonly store_public_id: string;
  readonly sent_at: string;
  readonly accepted_at: string;
}

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

  const rows = (data ?? []) as ClaimRow[];
  const closedAt = new Date();
  const domainEvents: OrderFinishedDomainEvent[] = [];
  let auditFailures = 0;

  for (const row of rows) {
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
      continue;
    }

    if (result.auditFailed) {
      auditFailures += 1;
    }

    const finished = result.value as OrderFinalizado;
    domainEvents.push({
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
    });
  }

  for (const event of domainEvents) {
    eventBus.publish(event);
  }

  return NextResponse.json({ count: domainEvents.length, auditFailures });
}
