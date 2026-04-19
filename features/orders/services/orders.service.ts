import type { Order, OrderItem } from "@/shared/schemas/order";
import type { OrderStatus } from "@/shared/constants/order";

export interface FindByUserInput {
  readonly clientId: string;
  readonly status?: OrderStatus;
}

export interface SendOrderInput {
  readonly storeId: string;
  readonly items: readonly OrderItem[];
  readonly notes?: string;
}

export interface OrdersService {
  readonly accept: (orderId: string) => Promise<Order>;
  readonly cancel: (orderId: string) => Promise<Order>;
  readonly confirmOnTheWay: (orderId: string) => Promise<Order>;
  readonly reject: (orderId: string) => Promise<Order>;
  readonly finalize: (orderId: string) => Promise<Order>;
  readonly findByUser: (input: FindByUserInput) => Promise<readonly Order[]>;
  readonly send: (input: SendOrderInput) => Promise<Order>;
  readonly getById: (orderId: string) => Promise<Order | null>;
}
