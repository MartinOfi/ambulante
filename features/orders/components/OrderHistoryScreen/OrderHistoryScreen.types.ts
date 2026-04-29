import type { Order } from "@/shared/schemas/order";
import type { OrderStatus } from "@/shared/constants/order";

export interface OrderHistoryScreenProps {
  readonly orders: readonly Order[];
  readonly isLoading: boolean;
  readonly activeStatus: OrderStatus | null;
  readonly onStatusChange: (status: OrderStatus | null) => void;
  readonly hasMore?: boolean;
  readonly isLoadingMore?: boolean;
  readonly onLoadMore?: () => void;
}
