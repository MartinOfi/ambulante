import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function DELETE(request: Request): Promise<NextResponse> {
  const rawBody = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Endpoint de suscripción inválido." }, { status: 400 });
  }

  const { endpoint } = parsed.data;

  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: userId, error: userError } = await supabase.rpc("current_user_id");

  if (userError || userId === null || userId === undefined) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la suscripción." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Suscripción no encontrada." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
