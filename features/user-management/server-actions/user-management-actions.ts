"use server";

import "server-only";

import { z } from "zod";

import { suspendUserSchema, reactivateUserSchema } from "@/shared/schemas/user-management";
import type { SuspendUserInput, ReactivateUserInput } from "@/shared/schemas/user-management";
import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseUserRepository, SupabaseOrderRepository } from "@/shared/repositories";
import { createUserManagementService } from "@/features/user-management/services/userManagement.service";
import { UserManagementDomainError } from "@/shared/domain/user-suspension";
import { serverLogger } from "@/shared/utils/server-logger";

export type UserManagementActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

const UNAUTHENTICATED_MESSAGE = "Sesión no válida. Iniciá sesión nuevamente.";
const FORBIDDEN_MESSAGE = "No tenés permisos para realizar esta acción.";
const GENERIC_ERROR_MESSAGE = "No se pudo completar la operación.";

async function ensureAdmin(): Promise<
  | { readonly ok: true; readonly client: Awaited<ReturnType<typeof createRouteHandlerClient>> }
  | { readonly ok: false; readonly error: string }
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
    serverLogger.error("user-management-actions: is_admin RPC failed", { error: adminError });
    return { ok: false, error: GENERIC_ERROR_MESSAGE };
  }
  if (isAdmin !== true) {
    return { ok: false, error: FORBIDDEN_MESSAGE };
  }

  return { ok: true, client };
}

function toUserMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE;
  }
  if (error instanceof UserManagementDomainError) {
    return error.message;
  }
  return GENERIC_ERROR_MESSAGE;
}

export async function suspendUserAction(
  input: SuspendUserInput,
): Promise<UserManagementActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  try {
    const parsed = suspendUserSchema.parse(input);
    const service = createUserManagementService({
      userRepository: new SupabaseUserRepository(gate.client),
      orderRepository: new SupabaseOrderRepository(gate.client),
    });
    await service.suspendUser(parsed);
    return { ok: true };
  } catch (error) {
    serverLogger.error("user-management-actions.suspendUserAction failed", {
      userId: input.userId,
      error,
    });
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function reactivateUserAction(
  input: ReactivateUserInput,
): Promise<UserManagementActionResult> {
  const gate = await ensureAdmin();
  if (gate.ok === false) return { ok: false, error: gate.error };

  try {
    const parsed = reactivateUserSchema.parse(input);
    const service = createUserManagementService({
      userRepository: new SupabaseUserRepository(gate.client),
      orderRepository: new SupabaseOrderRepository(gate.client),
    });
    await service.reactivateUser(parsed);
    return { ok: true };
  } catch (error) {
    serverLogger.error("user-management-actions.reactivateUserAction failed", {
      userId: input.userId,
      error,
    });
    return { ok: false, error: toUserMessage(error) };
  }
}
