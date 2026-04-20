import type { PendingStore } from "@/features/store-validation/types/store-validation.types";

export interface StoreDetailPanelProps {
  readonly store: PendingStore;
  readonly isApproving: boolean;
  readonly isRejecting: boolean;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}

export interface StoreDetailPanelContainerProps {
  readonly storeId: string;
}
