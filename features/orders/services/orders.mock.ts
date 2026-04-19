import type { OrdersService } from "./orders.service";

const MOCK_NETWORK_DELAY_MS = 300;

export const ordersService: OrdersService = {
  accept: async (_orderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
    throw new Error("ordersService.accept: not implemented — replace with real API call");
  },

  cancel: async (_orderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
    throw new Error("ordersService.cancel: not implemented — replace with real API call");
  },
};
