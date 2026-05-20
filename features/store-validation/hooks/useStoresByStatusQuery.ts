import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type {
  PendingStore,
  ValidationStatus,
} from "@/features/store-validation/types/store-validation.types";

async function fetchStoresByStatus(status: ValidationStatus): Promise<readonly PendingStore[]> {
  const res = await fetch(`/api/admin/stores?status=${encodeURIComponent(status)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Error obteniendo tiendas.");
  }
  const body = (await res.json()) as { data: readonly PendingStore[] };
  return body.data;
}

export function useStoresByStatusQuery(status: ValidationStatus) {
  return useQuery<readonly PendingStore[]>({
    queryKey: queryKeys.stores.byStatus(status),
    queryFn: () => fetchStoresByStatus(status),
    staleTime: 30_000,
  });
}
