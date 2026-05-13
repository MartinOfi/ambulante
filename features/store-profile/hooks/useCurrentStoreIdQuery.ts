"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/shared/hooks/useSession";
import { storesService } from "@/shared/services/stores";
import { queryKeys } from "@/shared/query/keys";

export function useCurrentStoreIdQuery() {
  const sessionResult = useSession();
  const userId = sessionResult.status === "authenticated" ? sessionResult.session.user.id : null;

  return useQuery({
    queryKey: userId ? queryKeys.stores.byOwner(userId) : queryKeys.stores.all(),
    queryFn: async () => {
      if (userId === null) return null;
      const store = await storesService.findByOwnerId(userId);
      return store?.id ?? null;
    },
    enabled: userId !== null,
  });
}
