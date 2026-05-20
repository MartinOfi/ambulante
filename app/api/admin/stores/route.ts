import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import { SupabaseStoreValidationService } from "@/features/store-validation/services/store-validation.supabase";
import type { ValidationStatus } from "@/features/store-validation/types/store-validation.types";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

const VALID_STATUSES = new Set<string>(Object.values(STORE_VALIDATION_STATUS));

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    serverLogger.error("admin/stores: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const rawStatus = new URL(request.url).searchParams.get("status");
  const status: ValidationStatus = VALID_STATUSES.has(rawStatus ?? "")
    ? (rawStatus as ValidationStatus)
    : STORE_VALIDATION_STATUS.pending;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("admin/stores: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = new SupabaseStoreValidationService(client);

  try {
    const stores = await service.getStoresByStatus(status);
    return NextResponse.json({ data: stores });
  } catch (error) {
    serverLogger.error("admin/stores: getStoresByStatus failed", { error, status });
    return NextResponse.json({ error: "Error obteniendo tiendas." }, { status: 500 });
  }
}
