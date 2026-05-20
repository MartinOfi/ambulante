import "server-only";

import { NextResponse } from "next/server";

import { createKpiDashboardService } from "@/features/admin-kpi-dashboard/services/kpi-dashboard.service";
import { env } from "@/shared/config/env";
import { SupabaseOrderRepository } from "@/shared/repositories/supabase/orders.supabase";
import { SupabaseStoreRepository } from "@/shared/repositories/supabase/stores.supabase";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export async function GET(): Promise<NextResponse> {
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
    serverLogger.error("kpi: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("kpi: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const orderRepo = new SupabaseOrderRepository(client);
  const storeRepo = new SupabaseStoreRepository(client);
  const service = createKpiDashboardService(orderRepo, storeRepo);

  try {
    const snapshot = await service.fetchKpiSnapshot();
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    serverLogger.error("kpi: fetchKpiSnapshot failed", { error });
    return NextResponse.json({ error: "Error calculando métricas." }, { status: 500 });
  }
}
