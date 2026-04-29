import type { ReactNode } from "react";
import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

export interface StoreDetailPanelProps {
  readonly store: PendingStore;
  readonly isApproving: boolean;
  readonly isRejecting: boolean;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly validationDocsSlot?: ReactNode;
}

export interface StoreDetailPanelContainerProps {
  readonly storeId: string;
}
