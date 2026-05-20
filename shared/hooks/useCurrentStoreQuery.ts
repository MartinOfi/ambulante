"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { Store } from "@/shared/schemas/store";

export function useCurrentStoreQuery() {
  return useQuery({
    queryKey: queryKeys.stores.me(),
    queryFn: async (): Promise<Store | null> => {
      const res = await fetch("/api/store/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Error obteniendo tienda del servidor");
      const json = (await res.json()) as { data: Store | null };
      return json.data;
    },
  });
}
