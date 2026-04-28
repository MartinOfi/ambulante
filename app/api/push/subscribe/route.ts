import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });
  }

  const { endpoint, keys, userAgent } = parsed.data;

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
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" },
    )
    .select("id, endpoint, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
