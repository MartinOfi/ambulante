import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/shared/config/env.runtime";

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

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Error de configuración del servidor." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

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
