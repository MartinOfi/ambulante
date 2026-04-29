"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserDetailQuery } from "@/features/user-management/hooks/useUserDetailQuery";
import { useSuspendUserMutation } from "@/features/user-management/hooks/useSuspendUserMutation";
import { useReactivateUserMutation } from "@/features/user-management/hooks/useReactivateUserMutation";
import { UserManagementDomainError } from "@/shared/domain/user-suspension";
import { UserDetailPage } from "./UserDetailPage";

const GENERIC_LOAD_ERROR = "No se pudo cargar el usuario.";

export interface UserDetailPageContainerProps {
  readonly userId: string;
}

export function UserDetailPageContainer({ userId }: UserDetailPageContainerProps) {
  const router = useRouter();
  const detailQuery = useUserDetailQuery({ userId });

  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setMutationErrorMessage(null);
    },
    onError: (message) => setMutationErrorMessage(message),
  });

  const reactivateMutation = useReactivateUserMutation({
    onSuccess: () => setMutationErrorMessage(null),
    onError: (message) => setMutationErrorMessage(message),
  });

  const handleBack = useCallback(() => router.push("/admin/users"), [router]);

  const handleSuspendRequest = useCallback(() => {
    setMutationErrorMessage(null);
    setSuspendDialogOpen(true);
  }, []);

  const handleSuspendCancel = useCallback(() => {
    setSuspendDialogOpen(false);
    setSuspendReason("");
    setMutationErrorMessage(null);
  }, []);

  const handleSuspendConfirm = useCallback(() => {
    suspendMutation.mutate({ userId, reason: suspendReason });
  }, [suspendMutation, userId, suspendReason]);

  const handleReactivate = useCallback(() => {
    reactivateMutation.mutate(userId);
  }, [reactivateMutation, userId]);

  const errorMessage =
    detailQuery.error === null
      ? null
      : detailQuery.error instanceof UserManagementDomainError
        ? detailQuery.error.message
        : GENERIC_LOAD_ERROR;

  return (
    <UserDetailPage
      user={detailQuery.data?.user ?? null}
      orders={detailQuery.data?.orders ?? []}
      isLoading={detailQuery.isLoading}
      errorMessage={errorMessage}
      mutationErrorMessage={mutationErrorMessage}
      suspendDialogOpen={suspendDialogOpen}
      suspendReason={suspendReason}
      isSuspendPending={suspendMutation.isPending}
      isReactivatePending={reactivateMutation.isPending}
      onBack={handleBack}
      onSuspendRequest={handleSuspendRequest}
      onSuspendCancel={handleSuspendCancel}
      onSuspendConfirm={handleSuspendConfirm}
      onSuspendReasonChange={setSuspendReason}
      onReactivate={handleReactivate}
    />
  );
}
