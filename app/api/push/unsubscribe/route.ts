import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabasePushSubscriptionRepository } from "@/shared/repositories/supabase/push-subscriptions.supabase";

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

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("public_id")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const publicId = (userData as { public_id: string }).public_id;
  const repo = new SupabasePushSubscriptionRepository(supabase);

  try {
    const sub = await repo.findByEndpoint(endpoint);

    if (!sub || sub.userId !== publicId) {
      return NextResponse.json({ error: "Suscripción no encontrada." }, { status: 404 });
    }

    await repo.delete(sub.id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar la suscripción." }, { status: 500 });
  }
}
