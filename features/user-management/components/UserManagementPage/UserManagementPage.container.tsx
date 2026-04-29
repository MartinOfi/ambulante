"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUsersQuery } from "@/features/user-management/hooks/useUsersQuery";
import { useSuspendUserMutation } from "@/features/user-management/hooks/useSuspendUserMutation";
import { useReactivateUserMutation } from "@/features/user-management/hooks/useReactivateUserMutation";
import { useUserManagementFilters } from "@/features/user-management/hooks/useUserManagementFilters";
import { UserManagementPage } from "./UserManagementPage";

interface PendingSuspension {
  readonly userId: string;
  readonly userEmail: string;
}

function matchesSearch(displayName: string | undefined, email: string, query: string): boolean {
  if (query.length === 0) return true;
  const needle = query.toLowerCase();
  if (email.toLowerCase().includes(needle)) return true;
  if (displayName !== undefined && displayName.toLowerCase().includes(needle)) return true;
  return false;
}

export function UserManagementPageContainer() {
  const router = useRouter();
  const filters = useUserManagementFilters();

  const [pendingSuspension, setPendingSuspension] = useState<PendingSuspension | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const usersQuery = useUsersQuery({
    role: filters.role ?? undefined,
    status: filters.status ?? undefined,
  });

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setPendingSuspension(null);
      setSuspendReason("");
      setErrorMessage(null);
    },
    onError: (message) => setErrorMessage(message),
  });

  const reactivateMutation = useReactivateUserMutation({
    onSuccess: () => setErrorMessage(null),
    onError: (message) => setErrorMessage(message),
  });

  const visibleUsers = useMemo(() => {
    const all = usersQuery.data ?? [];
    return all.filter((user) => matchesSearch(user.displayName, user.email, filters.searchQuery));
  }, [usersQuery.data, filters.searchQuery]);

  const handleSuspendRequest = useCallback(
    (userId: string) => {
      const user = (usersQuery.data ?? []).find((u) => u.id === userId);
      if (user === undefined) return;
      setErrorMessage(null);
      setSuspendReason("");
      setPendingSuspension({ userId, userEmail: user.email });
    },
    [usersQuery.data],
  );

  const handleSuspendConfirm = useCallback(() => {
    if (pendingSuspension === null) return;
    suspendMutation.mutate({ userId: pendingSuspension.userId, reason: suspendReason });
  }, [pendingSuspension, suspendReason, suspendMutation]);

  const handleSuspendCancel = useCallback(() => {
    setPendingSuspension(null);
    setSuspendReason("");
    setErrorMessage(null);
  }, []);

  const handleReactivate = useCallback(
    (userId: string) => {
      reactivateMutation.mutate(userId);
    },
    [reactivateMutation],
  );

  const handleView = useCallback(
    (userId: string) => {
      router.push(`/admin/users/${userId}`);
    },
    [router],
  );

  const pendingUserId = suspendMutation.isPending
    ? (suspendMutation.variables?.userId ?? null)
    : reactivateMutation.isPending
      ? (reactivateMutation.variables ?? null)
      : null;

  const queryError =
    usersQuery.error instanceof Error ? "No se pudieron cargar los usuarios." : null;

  return (
    <UserManagementPage
      users={visibleUsers}
      isLoading={usersQuery.isLoading}
      errorMessage={queryError ?? errorMessage}
      pendingUserId={pendingUserId}
      roleFilter={filters.roleFilter}
      statusFilter={filters.statusFilter}
      searchQuery={filters.searchQuery}
      suspendDialogEmail={pendingSuspension?.userEmail ?? null}
      suspendReason={suspendReason}
      isSuspendPending={suspendMutation.isPending}
      suspendErrorMessage={errorMessage}
      onRoleChange={filters.setRole}
      onStatusChange={filters.setStatus}
      onSearchChange={filters.setSearch}
      onSuspendRequest={handleSuspendRequest}
      onSuspendConfirm={handleSuspendConfirm}
      onSuspendCancel={handleSuspendCancel}
      onSuspendReasonChange={setSuspendReason}
      onReactivate={handleReactivate}
      onView={handleView}
    />
  );
}
