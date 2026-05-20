import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SupabaseUserRepository, SupabaseOrderRepository } from "@/shared/repositories";
import { createUserManagementService } from "@/features/user-management/services/userManagement.service";
import { USERS_PAGE_SIZE } from "@/features/user-management/constants";
import { USER_ROLES } from "@/shared/constants/user";
import { USER_SUSPENSION_STATUS } from "@/shared/constants/user-management";
import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

const VALID_ROLES = new Set<string>(Object.values(USER_ROLES));
const VALID_STATUSES = new Set<string>(Object.values(USER_SUSPENSION_STATUS));

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
    serverLogger.error("admin/users: is_admin RPC failed", { error: adminError });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const rawRole = searchParams.get("role");
  const rawStatus = searchParams.get("status");
  const rawPage = searchParams.get("page");

  const role: UserRole | undefined = VALID_ROLES.has(rawRole ?? "")
    ? (rawRole as UserRole)
    : undefined;
  const status: SuspensionStatus | undefined = VALID_STATUSES.has(rawStatus ?? "")
    ? (rawStatus as SuspensionStatus)
    : undefined;
  const page = rawPage !== null && /^\d+$/.test(rawPage) ? Math.max(1, parseInt(rawPage, 10)) : 1;
  const offset = (page - 1) * USERS_PAGE_SIZE;

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error("admin/users: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = createUserManagementService({
    userRepository: new SupabaseUserRepository(client),
    orderRepository: new SupabaseOrderRepository(client),
  });

  try {
    const users = await service.listUsers({ role, status, limit: USERS_PAGE_SIZE, offset });
    return NextResponse.json({ data: users });
  } catch (error) {
    serverLogger.error("admin/users: listUsers failed", { error, role, status, page });
    return NextResponse.json({ error: "Error obteniendo usuarios." }, { status: 500 });
  }
}
