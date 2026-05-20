import "server-only";

import { NextResponse } from "next/server";

import { SupabaseOrderRepository } from "@/shared/repositories/supabase/orders.supabase";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const client = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const order = await new SupabaseOrderRepository(client).findById(id);
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ data: order });
  } catch (error) {
    serverLogger.error("orders/[id]: findById failed", { error, orderId: id });
    return NextResponse.json({ error: "Error obteniendo pedido." }, { status: 500 });
  }
}
