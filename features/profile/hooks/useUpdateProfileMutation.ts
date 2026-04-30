"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logger } from "@/shared/utils/logger";
import type { User } from "@/shared/schemas/user";
import { updateProfile } from "@/features/profile/actions";
import type { UpdateProfileInput } from "@/features/profile/profile.schemas";

const PROFILE_QUERY_KEY = ["user", "me"] as const;

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<User> => {
      const result = await updateProfile(input);
      if (result.ok === false) throw new Error(result.message);
      return result.user;
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },

    onError: (error: unknown) => {
      logger.error("useUpdateProfileMutation: update failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}
