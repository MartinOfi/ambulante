import type { Order } from "@/shared/domain/order-state-machine";

export interface OrdersService {
  readonly accept: (orderId: string) => Promise<Order>;
  readonly reject: (orderId: string) => Promise<Order>;
  readonly finalize: (orderId: string) => Promise<Order>;
}
