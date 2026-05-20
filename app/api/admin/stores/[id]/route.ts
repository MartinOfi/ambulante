import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SupabaseStoreValidationService } from "@/features/store-validation/services/store-validation.supabase";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authClient = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await authClient.rpc("is_admin");

  if (adminError) {
    serverLogger.error("admin/stores/[id]: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const { id } = await params;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("admin/stores/[id]: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = new SupabaseStoreValidationService(client);

  try {
    const store = await service.getStoreById(id);
    if (store === null) {
      return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ data: store });
  } catch (error) {
    serverLogger.error("admin/stores/[id]: getStoreById failed", { error, id });
    return NextResponse.json({ error: "Error obteniendo tienda." }, { status: 500 });
  }
}
