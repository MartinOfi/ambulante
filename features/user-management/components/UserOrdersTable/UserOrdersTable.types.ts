import type { Order } from "@/shared/schemas/order";

export interface UserOrdersTableProps {
  readonly orders: readonly Order[];
}
