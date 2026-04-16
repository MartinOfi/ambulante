import type { Order } from "@/shared/domain/order-state-machine";

export interface OrdersService {
  readonly accept: (orderId: string) => Promise<Order>;
}

export const ordersService: OrdersService = {
  accept: async (_orderId: string): Promise<Order> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error("ordersService.accept: not implemented — replace with real API call");
  },
};
