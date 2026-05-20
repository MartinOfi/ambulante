import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SupabaseUserRepository, SupabaseOrderRepository } from "@/shared/repositories";
import { createUserManagementService } from "@/features/user-management/services/userManagement.service";
import { UserManagementDomainError } from "@/shared/domain/user-suspension";
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
    serverLogger.error("admin/users/[id]: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const { id } = await params;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("admin/users/[id]: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = createUserManagementService({
    userRepository: new SupabaseUserRepository(client),
    orderRepository: new SupabaseOrderRepository(client),
  });

  try {
    const detail = await service.getUserDetail({ userId: id });
    return NextResponse.json({ data: detail });
  } catch (error) {
    if (error instanceof UserManagementDomainError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    serverLogger.error("admin/users/[id]: getUserDetail failed", { error, id });
    return NextResponse.json({ error: "Error obteniendo usuario." }, { status: 500 });
  }
}
