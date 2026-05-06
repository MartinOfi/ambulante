"use server";

import "server-only";

import {
  createRouteHandlerClient,
  createServiceRoleClient,
} from "@/shared/repositories/supabase/client";
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
  // Session client: reads auth identity + public.users row via anon key + cookies.
  const sessionClient = await createRouteHandlerClient();

  // Service role client: bypasses RLS for the store INSERT.
  // The stores table has no INSERT policy for the authenticated role — writes
  // must go through service role (see rls_policies migration, stores section).
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl.trim() || !serviceRoleKey.trim()) {
    throw new Error(
      "submitStoreOnboardingAction: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  const serviceClient = createServiceRoleClient(supabaseUrl, serviceRoleKey);

  const deps: SubmitStoreOnboardingDeps = {
    async getCurrentUser(): Promise<User | null> {
      const { data: authData, error: authError } = await sessionClient.auth.getUser();
      if (authError !== null || authData.user === null) return null;

      const { data: row, error } = await sessionClient
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

    async findExistingStore(ownerId: string) {
      const repo = new SupabaseStoreRepository(serviceClient);
      return repo.findByOwnerId(ownerId);
    },

    async createStore(input) {
      const repo = new SupabaseStoreRepository(serviceClient);
      return repo.create(input);
    },

    generateStoreId() {
      return crypto.randomUUID();
    },
  };

  return submitStoreOnboarding(data, deps);
}
