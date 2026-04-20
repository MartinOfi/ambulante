"use client";

import { useState, useCallback } from "react";
import { useUsersQuery } from "@/features/user-management/hooks/useUsersQuery";
import { useSuspendUserMutation } from "@/features/user-management/hooks/useSuspendUserMutation";
import { useReinstateUserMutation } from "@/features/user-management/hooks/useReinstateUserMutation";
import type { UserManagementService } from "@/features/user-management/services/userManagement.service";
import { UserManagementPage } from "./UserManagementPage";

interface UserManagementPageContainerProps {
  readonly service: UserManagementService;
}

interface PendingSuspension {
  readonly userId: string;
  readonly userEmail: string;
}

export function UserManagementPageContainer({ service }: UserManagementPageContainerProps) {
  const [pendingSuspension, setPendingSuspension] = useState<PendingSuspension | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const usersQuery = useUsersQuery({ service });

  const suspendMutation = useSuspendUserMutation({
    service,
    onSuccess: () => {
      setPendingSuspension(null);
      setErrorMessage(null);
    },
    onError: (message) => {
      setErrorMessage(message);
    },
  });

  const reinstateMutation = useReinstateUserMutation({
    service,
    onSuccess: () => {
      setErrorMessage(null);
    },
    onError: (message) => {
      setErrorMessage(message);
    },
  });

  const handleSuspendRequest = useCallback(
    (userId: string) => {
      const user = usersQuery.data?.find((u) => u.id === userId);
      if (user === undefined) return;
      setPendingSuspension({ userId, userEmail: user.email });
    },
    [usersQuery.data],
  );

  const handleSuspendConfirm = useCallback(() => {
    if (pendingSuspension === null) return;
    suspendMutation.mutate(pendingSuspension.userId);
  }, [pendingSuspension, suspendMutation]);

  const handleSuspendCancel = useCallback(() => {
    setPendingSuspension(null);
  }, []);

  const handleReinstate = useCallback(
    (userId: string) => {
      reinstateMutation.mutate(userId);
    },
    [reinstateMutation],
  );

  const pendingUserId = suspendMutation.isPending
    ? (suspendMutation.variables ?? null)
    : reinstateMutation.isPending
      ? (reinstateMutation.variables ?? null)
      : null;

  return (
    <UserManagementPage
      users={usersQuery.data ?? []}
      isLoading={usersQuery.isLoading}
      errorMessage={errorMessage}
      pendingUserId={pendingUserId}
      suspendDialogEmail={pendingSuspension?.userEmail ?? null}
      isSuspendPending={suspendMutation.isPending}
      onSuspendRequest={handleSuspendRequest}
      onSuspendConfirm={handleSuspendConfirm}
      onSuspendCancel={handleSuspendCancel}
      onReinstate={handleReinstate}
    />
  );
}
