import type { Order } from "@/shared/schemas/order";

export interface StoreOrderDetailProps {
  readonly order: Order;
  readonly isPending: boolean;
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly onFinalize: () => void;
}
