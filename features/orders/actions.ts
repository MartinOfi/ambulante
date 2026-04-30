"use server";

import "server-only";

import { z } from "zod";
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
import {
  storeOrderTransitionInputSchema,
  type StoreOrderTransitionInput,
} from "@/features/orders/store-transitions.schemas";
import {
  STORE_ORDER_TRANSITION_ERROR_CODE,
  type StoreOrderTransitionErrorCode,
  ACCEPT_ORDER_ERROR_MESSAGE,
  REJECT_ORDER_ERROR_MESSAGE,
  FINALIZE_ORDER_ERROR_MESSAGE,
} from "@/features/orders/store-transitions.constants";

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

// ─────────────────────────────────────────────────────────────────────────────
// Store order state transitions: accept / reject / finalize
// ─────────────────────────────────────────────────────────────────────────────

export type AcceptOrderResult =
  | { readonly ok: true; readonly publicId: string; readonly status: typeof ORDER_STATUS.ACEPTADO }
  | {
      readonly ok: false;
      readonly errorCode: StoreOrderTransitionErrorCode;
      readonly message: string;
    };

export type RejectOrderResult =
  | { readonly ok: true; readonly publicId: string; readonly status: typeof ORDER_STATUS.RECHAZADO }
  | {
      readonly ok: false;
      readonly errorCode: StoreOrderTransitionErrorCode;
      readonly message: string;
    };

export type FinalizeOrderResult =
  | {
      readonly ok: true;
      readonly publicId: string;
      readonly status: typeof ORDER_STATUS.FINALIZADO;
    }
  | {
      readonly ok: false;
      readonly errorCode: StoreOrderTransitionErrorCode;
      readonly message: string;
    };

const storeRpcResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), publicId: z.string() }),
  z.object({
    ok: z.literal(false),
    error: z.enum(["unauthenticated", "not_found", "invalid_transition"]),
    currentStatus: z.string().optional(),
  }),
]);
type StoreRpcResult = z.infer<typeof storeRpcResultSchema>;
type StoreRpcFailure = Extract<StoreRpcResult, { ok: false }>;

function failStore(
  errorCode: StoreOrderTransitionErrorCode,
  messages: Readonly<Record<StoreOrderTransitionErrorCode, string>>,
): { ok: false; errorCode: StoreOrderTransitionErrorCode; message: string } {
  return { ok: false, errorCode, message: messages[errorCode] };
}

function mapStoreRpcError(
  payload: StoreRpcFailure,
  messages: Readonly<Record<StoreOrderTransitionErrorCode, string>>,
): { ok: false; errorCode: StoreOrderTransitionErrorCode; message: string } {
  if (payload.error === "unauthenticated")
    return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.UNAUTHENTICATED, messages);
  if (payload.error === "not_found")
    return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.ORDER_NOT_FOUND, messages);
  if (payload.error === "invalid_transition")
    return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.INVALID_TRANSITION, messages);
  return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR, messages);
}

async function publishAcceptedEvent(
  client: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  publicId: string,
): Promise<void> {
  try {
    const order = await new SupabaseOrderRepository(client).findById(publicId);
    if (order === null) return;
    const acceptedAt = new Date(order.updatedAt);
    eventBus.publish({
      type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
      orderId: order.id,
      clientId: order.clientId,
      storeId: order.storeId,
      occurredAt: acceptedAt,
      sentAt: new Date(order.createdAt),
      receivedAt: new Date(order.createdAt),
      acceptedAt,
    });
  } catch (error) {
    serverLogger.warn("acceptOrder: publishAcceptedEvent failed (non-fatal)", { publicId, error });
  }
}

async function publishRejectedEvent(
  client: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  publicId: string,
): Promise<void> {
  try {
    const order = await new SupabaseOrderRepository(client).findById(publicId);
    if (order === null) return;
    const rejectedAt = new Date(order.updatedAt);
    eventBus.publish({
      type: ORDER_DOMAIN_EVENT.ORDER_REJECTED,
      orderId: order.id,
      clientId: order.clientId,
      storeId: order.storeId,
      occurredAt: rejectedAt,
      sentAt: new Date(order.createdAt),
      receivedAt: new Date(order.createdAt),
      rejectedAt,
    });
  } catch (error) {
    serverLogger.warn("rejectOrder: publishRejectedEvent failed (non-fatal)", { publicId, error });
  }
}

async function publishFinishedEvent(
  client: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  publicId: string,
): Promise<void> {
  try {
    const order = await new SupabaseOrderRepository(client).findById(publicId);
    if (order === null) return;
    const finishedAt = new Date(order.updatedAt);
    const sentAt = new Date(order.createdAt);
    eventBus.publish({
      type: ORDER_DOMAIN_EVENT.ORDER_FINISHED,
      orderId: order.id,
      clientId: order.clientId,
      storeId: order.storeId,
      occurredAt: finishedAt,
      sentAt,
      receivedAt: sentAt,
      acceptedAt: sentAt,
      onTheWayAt: sentAt,
      finishedAt,
    });
  } catch (error) {
    serverLogger.warn("finalizeOrder: publishFinishedEvent failed (non-fatal)", {
      publicId,
      error,
    });
  }
}

export async function acceptOrder(input: StoreOrderTransitionInput): Promise<AcceptOrderResult> {
  const parsed = storeOrderTransitionInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message = parsed.error.issues[0]?.message ?? ACCEPT_ORDER_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: STORE_ORDER_TRANSITION_ERROR_CODE.VALIDATION_ERROR, message };
  }
  const { publicId } = parsed.data;
  try {
    const client = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError !== null || user === null)
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.UNAUTHENTICATED,
        ACCEPT_ORDER_ERROR_MESSAGE,
      );
    const { data, error } = await client.rpc("accept_order_by_store", { p_public_id: publicId });
    if (error !== null) {
      serverLogger.error("acceptOrder: RPC failed", { publicId, error });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        ACCEPT_ORDER_ERROR_MESSAGE,
      );
    }
    const parseResult = storeRpcResultSchema.safeParse(data);
    if (!parseResult.success) {
      serverLogger.error("acceptOrder: unexpected RPC shape", { publicId, data });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        ACCEPT_ORDER_ERROR_MESSAGE,
      );
    }
    const payload = parseResult.data;
    if (!payload.ok) return mapStoreRpcError(payload, ACCEPT_ORDER_ERROR_MESSAGE);
    await publishAcceptedEvent(client, publicId);
    return { ok: true, publicId, status: ORDER_STATUS.ACEPTADO };
  } catch (error) {
    serverLogger.error("acceptOrder failed", { publicId, error });
    return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR, ACCEPT_ORDER_ERROR_MESSAGE);
  }
}

export async function rejectOrder(input: StoreOrderTransitionInput): Promise<RejectOrderResult> {
  const parsed = storeOrderTransitionInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message = parsed.error.issues[0]?.message ?? REJECT_ORDER_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: STORE_ORDER_TRANSITION_ERROR_CODE.VALIDATION_ERROR, message };
  }
  const { publicId } = parsed.data;
  try {
    const client = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError !== null || user === null)
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.UNAUTHENTICATED,
        REJECT_ORDER_ERROR_MESSAGE,
      );
    const { data, error } = await client.rpc("reject_order_by_store", { p_public_id: publicId });
    if (error !== null) {
      serverLogger.error("rejectOrder: RPC failed", { publicId, error });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        REJECT_ORDER_ERROR_MESSAGE,
      );
    }
    const parseResult = storeRpcResultSchema.safeParse(data);
    if (!parseResult.success) {
      serverLogger.error("rejectOrder: unexpected RPC shape", { publicId, data });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        REJECT_ORDER_ERROR_MESSAGE,
      );
    }
    const payload = parseResult.data;
    if (!payload.ok) return mapStoreRpcError(payload, REJECT_ORDER_ERROR_MESSAGE);
    await publishRejectedEvent(client, publicId);
    return { ok: true, publicId, status: ORDER_STATUS.RECHAZADO };
  } catch (error) {
    serverLogger.error("rejectOrder failed", { publicId, error });
    return failStore(STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR, REJECT_ORDER_ERROR_MESSAGE);
  }
}

export async function finalizeOrder(
  input: StoreOrderTransitionInput,
): Promise<FinalizeOrderResult> {
  const parsed = storeOrderTransitionInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message =
      parsed.error.issues[0]?.message ?? FINALIZE_ORDER_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: STORE_ORDER_TRANSITION_ERROR_CODE.VALIDATION_ERROR, message };
  }
  const { publicId } = parsed.data;
  try {
    const client = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError !== null || user === null)
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.UNAUTHENTICATED,
        FINALIZE_ORDER_ERROR_MESSAGE,
      );
    const { data, error } = await client.rpc("finalize_order_by_store", { p_public_id: publicId });
    if (error !== null) {
      serverLogger.error("finalizeOrder: RPC failed", { publicId, error });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        FINALIZE_ORDER_ERROR_MESSAGE,
      );
    }
    const parseResult = storeRpcResultSchema.safeParse(data);
    if (!parseResult.success) {
      serverLogger.error("finalizeOrder: unexpected RPC shape", { publicId, data });
      return failStore(
        STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
        FINALIZE_ORDER_ERROR_MESSAGE,
      );
    }
    const payload = parseResult.data;
    if (!payload.ok) return mapStoreRpcError(payload, FINALIZE_ORDER_ERROR_MESSAGE);
    await publishFinishedEvent(client, publicId);
    return { ok: true, publicId, status: ORDER_STATUS.FINALIZADO };
  } catch (error) {
    serverLogger.error("finalizeOrder failed", { publicId, error });
    return failStore(
      STORE_ORDER_TRANSITION_ERROR_CODE.INTERNAL_ERROR,
      FINALIZE_ORDER_ERROR_MESSAGE,
    );
  }
}
