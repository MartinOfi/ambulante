import type { Order as StateMachineOrder } from "@/shared/domain/order-state-machine";
import type { Order } from "@/shared/schemas/order";
import type { OrderStatus } from "@/shared/constants/order";

export interface FindByUserInput {
  readonly clientId: string;
  readonly status?: OrderStatus;
}

export interface OrdersService {
  readonly accept: (orderId: string) => Promise<StateMachineOrder>;
  readonly findByUser: (input: FindByUserInput) => Promise<readonly Order[]>;
}
