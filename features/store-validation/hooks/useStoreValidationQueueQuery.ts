import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

async function fetchPendingStores(): Promise<readonly PendingStore[]> {
  const res = await fetch("/api/admin/stores?status=pending", { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Error obteniendo tiendas pendientes.");
  }
  const body = (await res.json()) as { data: readonly PendingStore[] };
  return body.data;
}

export function useStoreValidationQueueQuery() {
  return useQuery<readonly PendingStore[]>({
    queryKey: queryKeys.stores.pending(),
    queryFn: fetchPendingStores,
    staleTime: 30_000,
  });
}
