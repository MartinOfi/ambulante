import { orderRepository } from "@/shared/repositories";
import { ORDER_STATUS } from "@/shared/constants/order";
import { logger } from "@/shared/utils/logger";
import type { OrdersService, FindByUserInput } from "./orders.service";

const MOCK_NETWORK_DELAY_MS = 300;

const DEMO_SEEDS = [
  {
    clientId: "demo-client-1",
    storeId: "store-demo-1",
    status: ORDER_STATUS.ENVIADO,
    items: [{ productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 3 }],
    notes: "Sin picante por favor",
  },
  {
    clientId: "demo-client-1",
    storeId: "store-demo-1",
    status: ORDER_STATUS.ACEPTADO,
    items: [
      { productId: "p2", productName: "Choripán", productPriceArs: 1200, quantity: 2 },
      { productId: "p3", productName: "Gaseosa 500ml", productPriceArs: 400, quantity: 2 },
    ],
  },
  {
    clientId: "demo-client-1",
    storeId: "store-demo-2",
    status: ORDER_STATUS.FINALIZADO,
    items: [{ productId: "p4", productName: "Tacos x3", productPriceArs: 1800, quantity: 1 }],
  },
  {
    clientId: "demo-client-1",
    storeId: "store-demo-1",
    status: ORDER_STATUS.CANCELADO,
    items: [{ productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 1 }],
  },
  {
    clientId: "other-client",
    storeId: "store-demo-1",
    status: ORDER_STATUS.RECIBIDO,
    items: [{ productId: "p5", productName: "Pizza porción", productPriceArs: 900, quantity: 2 }],
  },
] as const;

async function seedDemoOrders(): Promise<void> {
  const existing = await orderRepository.findAll();
  if (existing.length > 0) return;

  for (const seed of DEMO_SEEDS) {
    await orderRepository.create({ ...seed, items: [...seed.items] });
  }
}

seedDemoOrders().catch((err) => {
  logger.error("seedDemoOrders failed", {
    error: err instanceof Error ? err.message : String(err),
  });
});

export const ordersService: OrdersService = {
  accept: async (_orderId: string) => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
    throw new Error("ordersService.accept: not implemented — replace with real API call");
  },

  findByUser: async ({ clientId, status }: FindByUserInput) => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
    return orderRepository.findAll({ clientId, status });
  },
};
