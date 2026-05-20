import "server-only";

import { NextResponse } from "next/server";

import { REPORT_STATUS, type ReportStatus } from "@/features/content-moderation/constants";
import { createSupabaseContentModerationService } from "@/features/content-moderation/services/content-moderation.supabase";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

const VALID_STATUSES = new Set<string>(Object.values(REPORT_STATUS));

export async function GET(request: Request): Promise<NextResponse> {
  const authClient = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError !== null || user === null) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await authClient.rpc("is_admin");

  if (adminError !== null) {
    serverLogger.error("admin/reports GET: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const rawStatus = new URL(request.url).searchParams.get("status");
  const status: ReportStatus = VALID_STATUSES.has(rawStatus ?? "")
    ? (rawStatus as ReportStatus)
    : REPORT_STATUS.PENDING;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("admin/reports GET: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = createSupabaseContentModerationService(client);

  try {
    const reports = await service.listReports({ status });
    return NextResponse.json({ data: reports });
  } catch (error) {
    serverLogger.error("admin/reports GET: listReports failed", { error, status });
    return NextResponse.json({ error: "Error obteniendo reportes." }, { status: 500 });
  }
}
