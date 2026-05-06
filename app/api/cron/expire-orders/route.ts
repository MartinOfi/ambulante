import { type NextRequest, NextResponse } from "next/server";

import { ORDER_DOMAIN_EVENT, type OrderExpiredDomainEvent } from "@/shared/domain/events";
import { eventBus } from "@/shared/domain/event-bus";
import {
  ORDER_ACTOR,
  ORDER_EVENT,
  transitionWithAudit,
  type OrderEnviado,
  type OrderExpirado,
  type OrderRecibido,
} from "@/shared/domain/order-state-machine";
import { env } from "@/shared/config/env";
import { ORDER_EXPIRATION_MINUTES, ORDER_STATUS } from "@/shared/constants/order";
import { SupabaseAuditLogService } from "@/shared/repositories/supabase/audit-log.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { dbStatusToDomain } from "@/shared/repositories/supabase/mappers";
import { logger } from "@/shared/utils/logger";

interface ClaimRow {
  readonly order_public_id: string;
  readonly old_status: string;
  readonly client_public_id: string;
  readonly store_public_id: string;
  readonly sent_at: string;
  readonly received_at: string | null;
}

function buildOrderForTransition(row: ClaimRow): OrderEnviado | OrderRecibido {
  const domainStatus = dbStatusToDomain(row.old_status);
  const base = {
    id: row.order_public_id,
    clientId: row.client_public_id,
    storeId: row.store_public_id,
    sentAt: new Date(row.sent_at),
  };

  if (domainStatus === ORDER_STATUS.ENVIADO) {
    return { ...base, status: ORDER_STATUS.ENVIADO };
  } else if (domainStatus === ORDER_STATUS.RECIBIDO) {
    if (row.received_at === null) {
      logger.warn("expire-orders: RECIBIDO order missing received_at, falling back to sentAt", {
        orderId: row.order_public_id,
      });
    }
    return {
      ...base,
      status: ORDER_STATUS.RECIBIDO,
      receivedAt: row.received_at !== null ? new Date(row.received_at) : base.sentAt,
    };
  } else {
    // The SQL WHERE clause guarantees status ∈ {enviado, recibido} — this is unreachable.
    throw new Error(`Unexpected status for expiration: ${domainStatus}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cronSecret = env.CRON_SECRET;
  if (cronSecret === undefined) {
    logger.error("expire-orders: CRON_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined || serviceRoleKey === undefined) {
    logger.error("expire-orders: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const auditLog = new SupabaseAuditLogService(client);

  const { data, error: rpcError } = await client.rpc("claim_expirable_orders", {
    p_expiration_minutes: ORDER_EXPIRATION_MINUTES,
  });

  if (rpcError !== null) {
    logger.error("expire-orders: claim_expirable_orders RPC failed", { error: rpcError });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const rows = (data ?? []) as ClaimRow[];
  const expiredAt = new Date();
  const domainEvents: OrderExpiredDomainEvent[] = [];
  let auditFailures = 0;

  for (const row of rows) {
    let order: ReturnType<typeof buildOrderForTransition>;
    try {
      order = buildOrderForTransition(row);
    } catch (err) {
      logger.error("expire-orders: unknown order status, skipping row", {
        orderId: row.order_public_id,
        status: row.old_status,
        error: err,
      });
      continue;
    }

    const result = await transitionWithAudit({
      order,
      event: { type: ORDER_EVENT.SISTEMA_EXPIRA, occurredAt: expiredAt },
      actor: ORDER_ACTOR.SISTEMA,
      auditLog,
    });

    if (!result.ok) {
      logger.error("expire-orders: unexpected transition failure", {
        orderId: row.order_public_id,
        error: result.error,
      });
      continue;
    }

    if (result.auditFailed) {
      auditFailures += 1;
    }

    const expired = result.value as OrderExpirado;
    domainEvents.push({
      type: ORDER_DOMAIN_EVENT.ORDER_EXPIRED,
      orderId: expired.id,
      clientId: expired.clientId,
      storeId: expired.storeId,
      occurredAt: expiredAt,
      sentAt: expired.sentAt,
      expiredAt: expired.expiredAt,
    });
  }

  for (const event of domainEvents) {
    eventBus.publish(event);
  }

  return NextResponse.json({ count: domainEvents.length, auditFailures });
}
