import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/shared/config/env";

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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la suscripción." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Suscripción no encontrada." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
