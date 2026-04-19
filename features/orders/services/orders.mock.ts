import { orderRepository } from "@/shared/repositories";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { OrdersService, FindByUserInput } from "./orders.service";

const MOCK_NETWORK_DELAY_MS = 300;

async function seedDemoOrders(): Promise<void> {
  const existing = await orderRepository.findAll();
  if (existing.length > 0) return;

  const demoClientId = "demo-client-1";
  const demoStoreId = "store-demo-1";
  const now = new Date();

  const seeds = [
    {
      clientId: demoClientId,
      storeId: demoStoreId,
      status: ORDER_STATUS.ENVIADO,
      items: [{ productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 3 }],
      notes: "Sin picante por favor",
    },
    {
      clientId: demoClientId,
      storeId: demoStoreId,
      status: ORDER_STATUS.ACEPTADO,
      items: [
        { productId: "p2", productName: "Choripán", productPriceArs: 1200, quantity: 2 },
        { productId: "p3", productName: "Gaseosa 500ml", productPriceArs: 400, quantity: 2 },
      ],
    },
    {
      clientId: demoClientId,
      storeId: "store-demo-2",
      status: ORDER_STATUS.FINALIZADO,
      items: [{ productId: "p4", productName: "Tacos x3", productPriceArs: 1800, quantity: 1 }],
    },
    {
      clientId: demoClientId,
      storeId: demoStoreId,
      status: ORDER_STATUS.CANCELADO,
      items: [{ productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 1 }],
    },
    {
      clientId: "other-client",
      storeId: demoStoreId,
      status: ORDER_STATUS.RECIBIDO,
      items: [{ productId: "p5", productName: "Pizza porción", productPriceArs: 900, quantity: 2 }],
    },
  ] as const;

  for (const seed of seeds) {
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    await orderRepository.create({ ...seed, items: [...seed.items] });
    // Override dates via update to simulate spread across past week
    void createdAt;
  }
}

void seedDemoOrders();

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
