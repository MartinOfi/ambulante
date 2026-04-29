"use server";

import "server-only";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import {
  SupabaseOrderRepository,
  SupabaseProductRepository,
  SupabaseStoreRepository,
  SupabaseUserRepository,
} from "@/shared/repositories";
import type { OrderItem } from "@/shared/schemas/order";
import type { Product } from "@/shared/schemas/product";
import { ORDER_STATUS } from "@/shared/constants/order";
import { eventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import { serverLogger } from "@/shared/utils/server-logger";
import {
  SUBMIT_ORDER_ERROR_CODE,
  SUBMIT_ORDER_ERROR_MESSAGE,
  type SubmitOrderErrorCode,
} from "@/features/order-flow/constants";
import {
  submitOrderInputSchema,
  type SubmitOrderInput,
  type SubmitOrderItemInput,
} from "@/features/order-flow/schemas";

const STORE_OPEN_STATUS = "open" as const;

export type SubmitOrderResult =
  | { readonly ok: true; readonly publicId: string; readonly status: typeof ORDER_STATUS.ENVIADO }
  | { readonly ok: false; readonly errorCode: SubmitOrderErrorCode; readonly message: string };

function fail(errorCode: SubmitOrderErrorCode): SubmitOrderResult {
  return { ok: false, errorCode, message: SUBMIT_ORDER_ERROR_MESSAGE[errorCode] };
}

function buildSnapshot(
  items: readonly SubmitOrderItemInput[],
  available: readonly Product[],
): readonly OrderItem[] | null {
  const productById = new Map(available.map((p) => [p.id, p] as const));
  const result: OrderItem[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (product === undefined) return null;
    result.push({
      productId: product.id,
      productName: product.name,
      productPriceArs: product.priceArs,
      quantity: item.quantity,
    });
  }
  return result;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const client = await createRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError !== null || user === null) return fail(SUBMIT_ORDER_ERROR_CODE.UNAUTHENTICATED);

  const parsed = submitOrderInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message = parsed.error.issues[0]?.message ?? SUBMIT_ORDER_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: SUBMIT_ORDER_ERROR_CODE.VALIDATION_ERROR, message };
  }

  const { storeId, items, notes } = parsed.data;

  try {
    const customer = await new SupabaseUserRepository(client).findByAuthUserId(user.id);
    if (customer === null) return fail(SUBMIT_ORDER_ERROR_CODE.UNAUTHENTICATED);

    const store = await new SupabaseStoreRepository(client).findById(storeId);
    if (store === null || store.status !== STORE_OPEN_STATUS) {
      return fail(SUBMIT_ORDER_ERROR_CODE.STORE_UNAVAILABLE);
    }

    const products = await new SupabaseProductRepository(client).findAll({
      storeId,
      isAvailable: true,
    });
    const snapshot = buildSnapshot(items, products);
    if (snapshot === null) return fail(SUBMIT_ORDER_ERROR_CODE.PRODUCT_UNAVAILABLE);

    const order = await new SupabaseOrderRepository(client).create({
      clientId: customer.id,
      storeId,
      status: ORDER_STATUS.ENVIADO,
      items: snapshot,
      notes,
    });

    const sentAt = new Date(order.createdAt);
    eventBus.publish({
      type: ORDER_DOMAIN_EVENT.ORDER_SENT,
      orderId: order.id,
      clientId: customer.id,
      storeId,
      occurredAt: sentAt,
      sentAt,
    });

    return { ok: true, publicId: order.id, status: ORDER_STATUS.ENVIADO };
  } catch (error) {
    serverLogger.error("submitOrder failed", { authUserId: user.id, storeId, error });
    return fail(SUBMIT_ORDER_ERROR_CODE.INTERNAL_ERROR);
  }
}
