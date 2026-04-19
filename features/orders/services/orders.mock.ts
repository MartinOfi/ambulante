import { ORDER_ACTOR, ORDER_EVENT, transition } from "@/shared/domain/order-state-machine";
import type { Order as DomainOrder, OrderEvent } from "@/shared/domain/order-state-machine";
import { orderRepository } from "@/shared/repositories";
import { ORDER_STATUS } from "@/shared/constants/order";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import type { OrdersService, FindByUserInput, SendOrderInput } from "./orders.service";

const MOCK_NETWORK_DELAY_MS = 300;
// Temporary stand-in until auth context is wired into the service layer
const DEMO_CLIENT_ID = "demo-client-1" as const;

const DEMO_SEEDS = [
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-1",
    status: ORDER_STATUS.ENVIADO,
    items: [
      { productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 3 },
    ],
    notes: "Sin picante por favor",
  },
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-1",
    status: ORDER_STATUS.ACEPTADO,
    items: [
      { productId: "p2", productName: "Choripán", productPriceArs: 1200, quantity: 2 },
      { productId: "p3", productName: "Gaseosa 500ml", productPriceArs: 400, quantity: 2 },
    ],
  },
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-2",
    status: ORDER_STATUS.FINALIZADO,
    items: [{ productId: "p4", productName: "Tacos x3", productPriceArs: 1800, quantity: 1 }],
  },
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-1",
    status: ORDER_STATUS.CANCELADO,
    items: [
      { productId: "p1", productName: "Empanada de carne", productPriceArs: 500, quantity: 1 },
    ],
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

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
}

type TransitionActor = (typeof ORDER_ACTOR)[keyof typeof ORDER_ACTOR];

async function applyTransition({
  orderId,
  event,
  actor,
  errorContext,
}: {
  readonly orderId: string;
  readonly event: OrderEvent;
  readonly actor: TransitionActor;
  readonly errorContext: string;
}): Promise<Order> {
  await delay();

  const persisted = await orderRepository.findById(orderId);
  if (persisted === null) {
    logger.error(`${errorContext}: order not found`, { orderId });
    throw new Error(`Order "${orderId}" not found`);
  }

  const domainOrder: DomainOrder = {
    id: persisted.id,
    clientId: persisted.clientId,
    storeId: persisted.storeId,
    sentAt: new Date(persisted.createdAt),
    // The status cast is safe: both models share the same ORDER_STATUS string literals.
    status: persisted.status as DomainOrder["status"],
  } as DomainOrder;

  const result = transition({ order: domainOrder, event, actor });

  if (!result.ok) {
    logger.error(`${errorContext}: invalid transition`, { orderId, error: result.error });
    throw new Error(`Transition failed: ${result.error.kind}`);
  }

  return orderRepository.update(orderId, { status: result.value.status });
}

export const ordersService: OrdersService = {
  accept: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = { type: ORDER_EVENT.TIENDA_ACEPTA, occurredAt: new Date() };
    return applyTransition({
      orderId,
      event,
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.accept",
    });
  },

  reject: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = { type: ORDER_EVENT.TIENDA_RECHAZA, occurredAt: new Date() };
    return applyTransition({
      orderId,
      event,
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.reject",
    });
  },

  finalize: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = { type: ORDER_EVENT.TIENDA_FINALIZA, occurredAt: new Date() };
    return applyTransition({
      orderId,
      event,
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.finalize",
    });
  },

  cancel: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = { type: ORDER_EVENT.CLIENTE_CANCELA, occurredAt: new Date() };
    return applyTransition({
      orderId,
      event,
      actor: ORDER_ACTOR.CLIENTE,
      errorContext: "ordersService.cancel",
    });
  },

  confirmOnTheWay: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = { type: ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO, occurredAt: new Date() };
    return applyTransition({
      orderId,
      event,
      actor: ORDER_ACTOR.CLIENTE,
      errorContext: "ordersService.confirmOnTheWay",
    });
  },

  findByUser: async ({ clientId, status }: FindByUserInput): Promise<readonly Order[]> => {
    await delay();
    return orderRepository.findAll({ clientId, status });
  },

  send: async ({ storeId, items, notes }: SendOrderInput): Promise<Order> => {
    await delay();
    return orderRepository.create({
      clientId: DEMO_CLIENT_ID,
      storeId,
      status: ORDER_STATUS.ENVIADO,
      items: [...items],
      notes,
    });
  },

  getById: async (orderId: string): Promise<Order | null> => {
    await delay();
    return orderRepository.findById(orderId);
  },
};
