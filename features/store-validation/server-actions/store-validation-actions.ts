"use server";

import "server-only";

import { z } from "zod";

import {
  REJECTION_REASON_MIN_LENGTH,
  REJECTION_REASON_MAX_LENGTH,
} from "@/features/store-validation/constants";
import { SupabaseStoreValidationService } from "@/features/store-validation/services/store-validation.supabase";
import { env } from "@/shared/config/env";
import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
import { serverLogger } from "@/shared/utils/server-logger";

export type StoreValidationActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

const UNAUTHENTICATED_MESSAGE = "Sesión no válida. Iniciá sesión nuevamente.";
const FORBIDDEN_MESSAGE = "No tenés permisos para realizar esta acción.";
const GENERIC_ERROR_MESSAGE = "No se pudo completar la operación.";

const rejectStoreSchema = z.object({
  storeId: z.string().min(1, "El ID de la tienda es requerido."),
  reason: z
    .string()
    .min(
      REJECTION_REASON_MIN_LENGTH,
      `El motivo debe tener al menos ${REJECTION_REASON_MIN_LENGTH} caracteres.`,
    )
    .max(
      REJECTION_REASON_MAX_LENGTH,
      `El motivo no puede superar ${REJECTION_REASON_MAX_LENGTH} caracteres.`,
    ),
});

async function buildService() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  return new SupabaseStoreValidationService(client);
}

async function ensureAdmin(): Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: string }
> {
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
    serverLogger.error("store-validation-actions: is_admin RPC failed", { error: adminError });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
  if (isAdmin !== true) {
    return { ok: false, error: FORBIDDEN_MESSAGE };
  }

  return { ok: true };
}

export async function approveStoreAction(storeId: string): Promise<StoreValidationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  const service = await buildService();
  if (service === null) {
    serverLogger.error("store-validation-actions.approveStoreAction: credentials not configured");
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }

  try {
    await service.approveStore(storeId);
    return { ok: true };
  } catch (error) {
    serverLogger.error("store-validation-actions.approveStoreAction failed", { storeId, error });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
}

export async function rejectStoreAction(input: unknown): Promise<StoreValidationActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  let parsed: z.infer<typeof rejectStoreSchema>;
  try {
    parsed = rejectStoreSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE };
    }
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }

  const service = await buildService();
  if (service === null) {
    serverLogger.error("store-validation-actions.rejectStoreAction: credentials not configured");
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }

  try {
    await service.rejectStore(parsed);
    return { ok: true };
  } catch (error) {
    serverLogger.error("store-validation-actions.rejectStoreAction failed", {
      storeId: parsed.storeId,
      error,
    });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
}
