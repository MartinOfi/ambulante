import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabasePushSubscriptionRepository } from "@/shared/repositories/supabase/push-subscriptions.supabase";

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

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("public_id")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const repo = new SupabasePushSubscriptionRepository(supabase);

  try {
    const subscription = await repo.upsertByEndpoint({
      userId: (userData as { public_id: string }).public_id,
      endpoint,
      p256dh: keys.p256dh,
      authKey: keys.auth,
      userAgent,
    });
    return NextResponse.json(subscription, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  }
}
