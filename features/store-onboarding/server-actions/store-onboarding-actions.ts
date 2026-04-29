"use server";

import "server-only";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { SupabaseStoreRepository } from "@/shared/repositories";
import { dbRoleToDomain } from "@/shared/repositories/supabase/mappers";
import { serverLogger } from "@/shared/utils/server-logger";
import {
  submitStoreOnboarding,
  type SubmitStoreOnboardingDeps,
  type SubmitStoreOnboardingResult,
} from "@/features/store-onboarding/services/submit-store-onboarding";
import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { User } from "@/shared/types/user";

export async function submitStoreOnboardingAction(
  data: StoreOnboardingData,
): Promise<SubmitStoreOnboardingResult> {
  const client = await createRouteHandlerClient();

  const deps: SubmitStoreOnboardingDeps = {
    async getCurrentUser(): Promise<User | null> {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError !== null || authData.user === null) return null;

      const { data: row, error } = await client
        .from("users")
        .select("public_id, role, display_name, email, suspended")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (error !== null) {
        serverLogger.error("submitStoreOnboardingAction: failed to load public.users row", {
          authUserId: authData.user.id,
          error: error.message,
        });
        return null;
      }
      if (row === null) return null;

      return {
        id: row.public_id,
        email: row.email ?? authData.user.email ?? "",
        role: dbRoleToDomain(row.role),
        displayName: row.display_name ?? undefined,
        suspended: row.suspended ?? undefined,
      };
    },

    async createStore(input) {
      const repo = new SupabaseStoreRepository(client);
      return repo.create(input);
    },

    generateStoreId() {
      return crypto.randomUUID();
    },
  };

  return submitStoreOnboarding(data, deps);
}
