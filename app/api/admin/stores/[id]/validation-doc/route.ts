import "server-only";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  VALIDATION_DOC_TYPES,
  VALIDATION_DOC_SIGNED_URL_EXPIRES_IN_S,
} from "@/features/store-validation/constants";
import { SupabaseStoreValidationService } from "@/features/store-validation/services/store-validation.supabase";
import type { ValidationDocType } from "@/features/store-validation/types/store-validation.types";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

const VALID_DOC_TYPES = new Set<string>(Object.values(VALIDATION_DOC_TYPES));

export async function GET(
  request: NextRequest,
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
    serverLogger.error("admin/stores/[id]/validation-doc: is_admin RPC failed", {
      error: adminError,
    });
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const { id } = await params;
  const rawDocType = new URL(request.url).searchParams.get("docType");

  if (!VALID_DOC_TYPES.has(rawDocType ?? "")) {
    return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
  }

  const docType = rawDocType as ValidationDocType;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    serverLogger.error(
      "admin/stores/[id]/validation-doc: Supabase service role credentials not configured",
    );
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const service = new SupabaseStoreValidationService(client);

  try {
    const meta = await service.getValidationDoc({ storeId: id, docType });
    if (meta === null) {
      return NextResponse.json({ data: null });
    }

    const { data: signedData, error: signedError } = await client.storage
      .from("validation-docs")
      .createSignedUrl(meta.path, VALIDATION_DOC_SIGNED_URL_EXPIRES_IN_S);

    if (signedError || signedData === null) {
      serverLogger.error("admin/stores/[id]/validation-doc: createSignedUrl failed", {
        error: signedError,
        path: meta.path,
      });
      return NextResponse.json({ error: "Error generando URL de documento." }, { status: 500 });
    }

    return NextResponse.json({
      data: { url: signedData.signedUrl, mimeType: meta.mimeType, filename: meta.filename },
    });
  } catch (error) {
    serverLogger.error("admin/stores/[id]/validation-doc: failed", { error, id, docType });
    return NextResponse.json({ error: "Error obteniendo documento." }, { status: 500 });
  }
}
