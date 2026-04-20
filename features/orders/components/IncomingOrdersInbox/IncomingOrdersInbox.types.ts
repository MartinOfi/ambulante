import type { Order } from "@/shared/schemas/order";

export interface IncomingOrdersInboxProps {
  readonly orders: readonly Order[];
  readonly isLoading: boolean;
  readonly onAccept: (orderId: string) => void;
  readonly onReject: (orderId: string) => void;
  readonly onFinalize: (orderId: string) => void;
  readonly pendingOrderId: string | null;
}
