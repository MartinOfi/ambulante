"use client";

import { useState } from "react";
import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { useApproveStoreMutation } from "@/features/store-validation/hooks/useApproveStoreMutation";
import { useRejectStoreMutation } from "@/features/store-validation/hooks/useRejectStoreMutation";
import { RejectStoreDialog } from "@/features/store-validation/components/RejectStoreDialog/RejectStoreDialog";
import { StoreDetailPanel } from "./StoreDetailPanel";
import type { StoreDetailPanelContainerProps } from "./StoreDetailPanel.types";

export function StoreDetailPanelContainer({
  storeId,
  onActionComplete,
}: StoreDetailPanelContainerProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { data: stores = [] } = useStoreValidationQueueQuery();
  const store = stores.find((s) => s.id === storeId);

  const approveMutation = useApproveStoreMutation();
  const rejectMutation = useRejectStoreMutation();

  if (store === undefined) {
    return (
      <div data-testid="store-not-found" className="p-8 text-center text-zinc-500">
        Tienda no encontrada
      </div>
    );
  }

  function handleApprove() {
    approveMutation.mutate(storeId, { onSuccess: onActionComplete });
  }

  function handleRejectConfirm(reason: string) {
    rejectMutation.mutate(
      { storeId, reason },
      {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          onActionComplete();
        },
      },
    );
  }

  return (
    <>
      <StoreDetailPanel
        store={store}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        onApprove={handleApprove}
        onReject={() => setIsRejectDialogOpen(true)}
      />

      <RejectStoreDialog
        open={isRejectDialogOpen}
        isSubmitting={rejectMutation.isPending}
        onConfirm={handleRejectConfirm}
        onCancel={() => setIsRejectDialogOpen(false)}
      />
    </>
  );
}
