"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import { useSession } from "@/shared/hooks/useSession";
import { storesService } from "@/shared/services/stores";

export function useCurrentStoreQuery() {
  const sessionResult = useSession();
  const userId = sessionResult.status === "authenticated" ? sessionResult.session.user.id : null;

  return useQuery({
    queryKey: userId ? queryKeys.stores.byOwner(userId) : queryKeys.stores.all(),
    queryFn: async () => {
      if (!userId) throw new Error("userId required");
      return storesService.findByOwnerId(userId);
    },
    enabled: userId !== null,
  });
}
