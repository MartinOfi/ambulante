import type { Order } from "@/shared/schemas/order";

export interface IncomingOrdersInboxProps {
  readonly orders: readonly Order[];
  readonly isLoading: boolean;
}
