import type { OrdersService } from "./orders.service";

export const ordersService: OrdersService = {
  accept: async (_orderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error("ordersService.accept: not implemented — replace with real API call");
  },
};
