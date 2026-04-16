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

export type OrderRepository = Repository<Order, CreateOrderInput, UpdateOrderInput, OrderFilters>;
