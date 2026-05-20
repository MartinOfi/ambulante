"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query/keys";
import type { UserRole } from "@/shared/schemas/user";
import type { SuspensionStatus } from "@/shared/domain/user-suspension";
import type { User } from "@/shared/schemas/user";

export interface UseUsersQueryInput {
  readonly role?: UserRole;
  readonly status?: SuspensionStatus;
  readonly page?: number;
}

async function fetchUsers(
  role: UserRole | undefined,
  status: SuspensionStatus | undefined,
  page: number,
): Promise<readonly User[]> {
  const params = new URLSearchParams();
  if (role !== undefined) params.set("role", role);
  if (status !== undefined) params.set("status", status);
  params.set("page", String(page));

  const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Error obteniendo usuarios.");
  }
  const body = (await res.json()) as { data: readonly User[] };
  return body.data;
}

export function useUsersQuery({ role, status, page = 1 }: UseUsersQueryInput = {}) {
  return useQuery({
    queryKey: [...queryKeys.users.all(), { role, status, page }] as const,
    queryFn: () => fetchUsers(role, status, page),
    placeholderData: (prev) => prev,
  });
}
