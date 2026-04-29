import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ORDER_STATUS } from "@/shared/constants/order";
import { orderRepository } from "@/shared/repositories/mock/order.mock";
import { isE2ETestMode } from "@/shared/services/push.test-capture";

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_CREATED = 201;

const MAX_ITEMS = 10;
const MAX_QUANTITY = 99;
const MAX_PRICE_ARS = 100_000;

const itemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(120),
  productPriceArs: z.number().int().positive().max(MAX_PRICE_ARS),
  quantity: z.number().int().positive().max(MAX_QUANTITY),
});

const bodySchema = z.object({
  clientId: z.string().min(1),
  storeId: z.string().min(1),
  items: z.array(itemSchema).min(1).max(MAX_ITEMS),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isE2ETestMode()) {
    return NextResponse.json({ error: "Not found" }, { status: HTTP_NOT_FOUND });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: HTTP_BAD_REQUEST });
  }

  const { clientId, storeId, items, notes } = parsed.data;
  const created = await orderRepository.create({
    clientId,
    storeId,
    status: ORDER_STATUS.RECIBIDO,
    items: [...items],
    notes,
  });

  return NextResponse.json({ orderId: created.id }, { status: HTTP_CREATED });
}
