"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { useApproveStoreMutation } from "@/features/store-validation/hooks/useApproveStoreMutation";
import { useRejectStoreMutation } from "@/features/store-validation/hooks/useRejectStoreMutation";
import { RejectStoreDialog } from "@/features/store-validation/components/RejectStoreDialog/RejectStoreDialog";
import { ValidationDocViewerContainer } from "@/features/store-validation/components/ValidationDocViewer/ValidationDocViewer.container";
import {
  VALIDATION_DOC_TYPES,
  VALIDATION_DOC_TYPE_LABELS,
} from "@/features/store-validation/constants";
import { StoreDetailPanel } from "./StoreDetailPanel";
import type { StoreDetailPanelContainerProps } from "./StoreDetailPanel.types";

const VALIDATION_DOCS_TO_REVIEW = [
  VALIDATION_DOC_TYPES.ID_FRONT,
  VALIDATION_DOC_TYPES.ID_BACK,
  VALIDATION_DOC_TYPES.BUSINESS_PROOF,
] as const;

export function StoreDetailPanelContainer({ storeId }: StoreDetailPanelContainerProps) {
  const router = useRouter();
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
    approveMutation.mutate(storeId, {
      onSuccess: () => router.push(ROUTES.admin.stores),
    });
  }

  function handleRejectConfirm(reason: string) {
    rejectMutation.mutate(
      { storeId, reason },
      {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          router.push(ROUTES.admin.stores);
        },
      },
    );
  }

  const validationDocsSlot = (
    <>
      {VALIDATION_DOCS_TO_REVIEW.map((docType) => (
        <ValidationDocViewerContainer
          key={docType}
          storeId={store.id}
          docType={docType}
          label={VALIDATION_DOC_TYPE_LABELS[docType]}
        />
      ))}
    </>
  );

  return (
    <>
      <StoreDetailPanel
        store={store}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        onApprove={handleApprove}
        onReject={() => setIsRejectDialogOpen(true)}
        validationDocsSlot={validationDocsSlot}
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
