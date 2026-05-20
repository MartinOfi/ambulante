import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SupabaseOrderRepository } from "@/shared/repositories/supabase/orders.supabase";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseStoreRepository } from "@/shared/repositories/supabase/stores.supabase";
import { orderStatusSchema } from "@/shared/schemas/order";
import { serverLogger } from "@/shared/utils/server-logger";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: userRow, error: userError } = await client
    .from("users")
    .select("public_id")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userRow) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const store = await new SupabaseStoreRepository(client).findByOwnerId(userRow.public_id);
  if (!store) {
    return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const rawStatus = searchParams.get("status");
  const statusParse = rawStatus ? orderStatusSchema.safeParse(rawStatus) : null;

  if (statusParse && !statusParse.success) {
    return NextResponse.json({ error: "Estado de pedido inválido." }, { status: 400 });
  }

  try {
    const orders = await new SupabaseOrderRepository(client).findAll({
      storeId: store.id,
      status: statusParse?.data,
    });
    return NextResponse.json({ data: orders });
  } catch (error) {
    serverLogger.error("store/orders: findAll failed", { error });
    return NextResponse.json({ error: "Error obteniendo pedidos." }, { status: 500 });
  }
}
