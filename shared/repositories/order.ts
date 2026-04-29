import type { Order, OrderItem } from "@/shared/schemas/order";
import type { OrderStatus } from "@/shared/constants/order";
import type { Repository } from "./base";

export interface OrderFilters {
  readonly storeId?: string;
  readonly clientId?: string;
  readonly status?: OrderStatus;
}

export interface CreateOrderInput {
  readonly clientId: string;
  readonly storeId: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly notes?: string;
}

export type UpdateOrderInput = Partial<Pick<Order, "status" | "notes">>;

export const DEFAULT_ORDER_HISTORY_PAGE_SIZE = 20;
export const MAX_ORDER_HISTORY_PAGE_SIZE = 100;

export interface FindByCustomerOptions {
  // Opaco: encode/decode vía shared/repositories/supabase/cursor.
  readonly cursor?: string | null;
  readonly limit?: number;
  readonly status?: OrderStatus;
}

export interface OrderHistoryPage {
  readonly orders: readonly Order[];
  readonly nextCursor: string | null;
}

export interface OrderRepository
  extends Repository<Order, CreateOrderInput, UpdateOrderInput, OrderFilters> {
  findByCustomer(customerId: string, opts?: FindByCustomerOptions): Promise<OrderHistoryPage>;
}
