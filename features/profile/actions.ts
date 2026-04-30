"use server";

import "server-only";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseUserRepository } from "@/shared/repositories";
import type { User } from "@/shared/schemas/user";
import { serverLogger } from "@/shared/utils/server-logger";
import {
  updateProfileInputSchema,
  type UpdateProfileInput,
} from "@/features/profile/profile.schemas";
import {
  UPDATE_PROFILE_ERROR_CODE,
  UPDATE_PROFILE_ERROR_MESSAGE,
  type UpdateProfileErrorCode,
} from "@/features/profile/profile.constants";

export type UpdateProfileResult =
  | { readonly ok: true; readonly user: User }
  | {
      readonly ok: false;
      readonly errorCode: UpdateProfileErrorCode;
      readonly message: string;
    };

function fail(errorCode: UpdateProfileErrorCode, override?: string): UpdateProfileResult {
  return {
    ok: false,
    errorCode,
    message: override ?? UPDATE_PROFILE_ERROR_MESSAGE[errorCode],
  };
}

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const parsed = updateProfileInputSchema.safeParse(input);
  if (parsed.success === false) {
    const message = parsed.error.issues[0]?.message ?? UPDATE_PROFILE_ERROR_MESSAGE.VALIDATION_ERROR;
    return { ok: false, errorCode: UPDATE_PROFILE_ERROR_CODE.VALIDATION_ERROR, message };
  }

  try {
    const client = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError !== null || user === null) return fail(UPDATE_PROFILE_ERROR_CODE.UNAUTHENTICATED);

    const userRepo = new SupabaseUserRepository(client);
    const customer = await userRepo.findByAuthUserId(user.id);
    if (customer === null) return fail(UPDATE_PROFILE_ERROR_CODE.UNAUTHENTICATED);

    const updated = await userRepo.update(customer.id, parsed.data);
    return { ok: true, user: updated };
  } catch (error) {
    serverLogger.error("updateProfile failed", { error });
    return fail(UPDATE_PROFILE_ERROR_CODE.INTERNAL_ERROR);
  }
}
