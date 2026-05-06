import type { ReactNode } from "react";
import type { Order } from "@/shared/schemas/order";
import type { LocationPublishingStatus } from "@/features/store-shell";

export interface StoreDashboardProps {
  readonly isAvailable: boolean;
  readonly locationStatus: LocationPublishingStatus;
  readonly incomingOrders: readonly Order[];
  readonly isLoadingOrders: boolean;
  readonly onToggleAvailability: () => void;
  readonly notificationOptInSlot?: ReactNode;
}
