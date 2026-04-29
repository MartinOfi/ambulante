"use server";

import "server-only";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseOrderRepository } from "@/shared/repositories";
import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import { dbStatusToDomain } from "@/shared/repositories/supabase/mappers";
import { eventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import { serverLogger } from "@/shared/utils/server-logger";
import { cancelOrderInputSchema, type CancelOrderInput } from "@/features/orders/cancel.schemas";
import {
  CANCEL_ORDER_ERROR_CODE,
  CANCEL_ORDER_ERROR_MESSAGE,
  type CancelOrderErrorCode,
} from "@/features/orders/cancel.constants";
import { getCancelRejectionMessage } from "@/features/orders/state-machine";

export type CancelOrderResult =
  | {
      readonly ok: true;
      readonly publicId: string;
      readonly status: typeof ORDER_STATUS.CANCELADO;
    }
  | {
      readonly ok: false;
      readonly errorCode: CancelOrderErrorCode;
      readonly message: string;
    };

interface CancelRpcResult {
  readonly ok?: boolean;
  readonly publicId?: string;
  readonly error?: "unauthenticated" | "not_found" | "invalid_transition";
  readonly currentStatus?: string;
}

function fail(errorCode: CancelOrderErrorCode, override?: string): CancelOrderResult {
  return {
    ok: false,
    errorCode,
    message: override ?? CANCEL_ORDER_ERROR_MESSAGE[errorCode],
  };
}

function mapRpcError(payload: CancelRpcResult): CancelOrderResult {
  if (payload.error === "unauthenticated") {
    return fail(CANCEL_ORDER_ERROR_CODE.UNAUTHENTICATED);
  }
  if (payload.error === "not_found") {
    return fail(CANCEL_ORDER_ERROR_CODE.ORDER_NOT_FOUND);
  }
  if (payload.error === "invalid_transition") {
    const currentStatus = parseDbStatus(payload.currentStatus);
    const message =
      currentStatus !== null
        ? getCancelRejectionMessage(currentStatus)
        : CANCEL_ORDER_ERROR_MESSAGE.INVALID_TRANSITION;
    return fail(CANCEL_ORDER_ERROR_CODE.INVALID_TRANSITION, message);
  }
  return fail(CANCEL_ORDER_ERROR_CODE.INTERNAL_ERROR);
}

function parseDbStatus(raw: string | undefined): OrderStatus | null {
  if (raw === undefined) return null;
  try {
    return dbStatusToDomain(raw);
  } catch {
    return null;
  }
}

// El evento es best-effort: la cancelación en DB ya quedó comiteada por el RPC.
// Si la lectura post-cancel falla, loggeamos y seguimos — los listeners (push,
// realtime) re-sincronizan en su próximo tick.
async function publishCancelledEvent(
  client: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  publicId: string,
): Promise<void> {
  try {
    const order = await new SupabaseOrderRepository(client).findById(publicId);
    if (order === null) return;
    const sentAt = new Date(order.createdAt);
    const cancelledAt = new Date();
    eventBus.publish({
      type: ORDER_DOMAIN_EVENT.ORDER_CANCELLED,
      orderId: order.id,
      clientId: order.clientId,
      storeId: order.storeId,
      occurredAt: cancelledAt,
      sentAt,
      cancelledAt,
    });
  } catch (error) {
    serverLogger.warn("cancelOrder: publishCancelledEvent failed (non-fatal)", {
      publicId,
      error,
    });
  }
}

export async function cancelOrder(input: CancelOrderInput): Promise<CancelOrderResult> {
  const parsed = cancelOrderInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message = parsed.error.issues[0]?.message ?? CANCEL_ORDER_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: CANCEL_ORDER_ERROR_CODE.VALIDATION_ERROR, message };
  }

  const { publicId, reason } = parsed.data;

  try {
    const client = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError !== null || user === null) return fail(CANCEL_ORDER_ERROR_CODE.UNAUTHENTICATED);

    const { data, error } = await client.rpc("cancel_order_by_customer", {
      p_public_id: publicId,
      p_reason: reason ?? null,
    });
    if (error !== null) {
      serverLogger.error("cancelOrder: RPC failed", { publicId, error });
      return fail(CANCEL_ORDER_ERROR_CODE.INTERNAL_ERROR);
    }

    const payload = (data ?? {}) as CancelRpcResult;
    if (payload.ok !== true) return mapRpcError(payload);

    await publishCancelledEvent(client, publicId);
    return { ok: true, publicId, status: ORDER_STATUS.CANCELADO };
  } catch (error) {
    serverLogger.error("cancelOrder failed", { publicId, error });
    return fail(CANCEL_ORDER_ERROR_CODE.INTERNAL_ERROR);
  }
}
