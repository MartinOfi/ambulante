"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { UserDetail } from "@/features/user-management/services/userManagement.service";

export interface UseUserDetailQueryInput {
  readonly userId: string;
  readonly enabled?: boolean;
}

async function fetchUserDetail(userId: string): Promise<UserDetail> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Error obteniendo usuario.");
  }
  const body = (await res.json()) as { data: UserDetail };
  return body.data;
}

export function useUserDetailQuery({ userId, enabled = true }: UseUserDetailQueryInput) {
  return useQuery({
    queryKey: queryKeys.users.byId(userId),
    queryFn: () => fetchUserDetail(userId),
    enabled: enabled && userId.length > 0,
  });
}
