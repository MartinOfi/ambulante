import type { Order } from "@/shared/schemas/order";

export interface OrderTrackingProps {
  readonly order: Order;
  readonly onConfirmOnTheWay: () => void;
  readonly onCancel: () => void;
  readonly isCancelling: boolean;
  readonly isConfirmingOnTheWay: boolean;
}
