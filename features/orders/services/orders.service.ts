import type { Order } from "@/shared/schemas/order";
import type { OrderStatus } from "@/shared/constants/order";

export interface FindByUserInput {
  readonly clientId: string;
  readonly status?: OrderStatus;
}

export interface OrdersService {
  readonly accept: (orderId: string) => Promise<Order>;
  readonly reject: (orderId: string) => Promise<Order>;
  readonly finalize: (orderId: string) => Promise<Order>;
  readonly findByUser: (input: FindByUserInput) => Promise<readonly Order[]>;
}
