"use server";

import "server-only";

import { createSupabaseContentModerationService } from "@/features/content-moderation/services/content-moderation.supabase";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export type ModerationActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

const UNAUTHENTICATED_MESSAGE = "Sesión no válida. Iniciá sesión nuevamente.";
const FORBIDDEN_MESSAGE = "No tenés permisos para realizar esta acción.";
const GENERIC_ERROR_MESSAGE = "No se pudo completar la operación.";

async function ensureAdmin(): Promise<ModerationActionResult> {
  const client = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError !== null || user === null) {
    return { ok: false, error: UNAUTHENTICATED_MESSAGE };
  }

  const { data: isAdmin, error: adminError } = await client.rpc("is_admin");
  if (adminError !== null) {
    serverLogger.error("content-moderation-actions: is_admin RPC failed", { error: adminError });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
  if (isAdmin !== true) {
    return { ok: false, error: FORBIDDEN_MESSAGE };
  }

  return { ok: true };
}

function buildService() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseContentModerationService(
    createServiceRoleClient(supabaseUrl, serviceRoleKey),
  );
}

export async function dismissReportAction(reportId: string): Promise<ModerationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  const service = buildService();
  if (service === null) {
    serverLogger.error("dismissReportAction: credentials not configured");
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }

  try {
    await service.dismissReport(reportId);
    return { ok: true };
  } catch (error) {
    serverLogger.error("dismissReportAction failed", { reportId, error });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
}

export async function removeContentAction(reportId: string): Promise<ModerationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  const service = buildService();
  if (service === null) {
    serverLogger.error("removeContentAction: credentials not configured");
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }

  try {
    await service.removeContent(reportId);
    return { ok: true };
  } catch (error) {
    serverLogger.error("removeContentAction failed", { reportId, error });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
}
