import "server-only";

import { NextResponse } from "next/server";

import { SupabaseStoreRepository } from "@/shared/repositories/supabase/stores.supabase";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export async function GET(): Promise<NextResponse> {
  const client = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    // user.id is auth.users.id (auth UUID), but stores_view.owner_public_id
    // is users.public_id (application UUID) — they differ, so we resolve first.
    const { data: userRow, error: userError } = await client
      .from("users")
      .select("public_id")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ data: null });
    }

    const store = await new SupabaseStoreRepository(client).findByOwnerId(userRow.public_id);
    return NextResponse.json({ data: store });
  } catch (error) {
    serverLogger.error("store/me: findByOwnerId failed", { error });
    return NextResponse.json({ error: "Error obteniendo tienda." }, { status: 500 });
  }
}
