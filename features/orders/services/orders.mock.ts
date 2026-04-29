import { ORDER_ACTOR, ORDER_EVENT, transition } from "@/shared/domain/order-state-machine";
import type { Order as DomainOrder, OrderEvent } from "@/shared/domain/order-state-machine";
import { orderRepository } from "@/shared/repositories";
import { ORDER_STATUS } from "@/shared/constants/order";
import { logger } from "@/shared/utils/logger";
import type { Order } from "@/shared/schemas/order";
import { eventBus } from "@/shared/domain/event-bus";
import { ORDER_DOMAIN_EVENT } from "@/shared/domain/events";
import type { OrderDomainEvent } from "@/shared/domain/events";
import type {
  OrdersService,
  FindByUserInput,
  FindByStoreInput,
  SendOrderInput,
} from "./orders.service";

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
  // Seed for E2E realtime test (realtime.spec.ts): RECIBIDO for demo-client-1 at store-demo-1
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-1",
    status: ORDER_STATUS.RECIBIDO,
    items: [
      { productId: "p6", productName: "Pizza porción E2E", productPriceArs: 900, quantity: 1 },
    ],
  },
  // Seed for B6.4 propagation SLA test (realtime-propagation.spec.ts): uses store-demo-2 to
  // avoid state conflicts with the store-demo-1 order above when both suites run in the same server.
  {
    clientId: DEMO_CLIENT_ID,
    storeId: "store-demo-2",
    status: ORDER_STATUS.RECIBIDO,
    items: [{ productId: "p7", productName: "Taco E2E B6.4", productPriceArs: 800, quantity: 2 }],
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

function buildOrderDomainEvent(order: Order): OrderDomainEvent | null {
  const now = new Date();
  const sentAt = new Date(order.createdAt);
  const base = {
    orderId: order.id,
    clientId: order.clientId,
    storeId: order.storeId,
    occurredAt: now,
    sentAt,
  };
  switch (order.status) {
    case ORDER_STATUS.RECIBIDO:
      return { ...base, type: ORDER_DOMAIN_EVENT.ORDER_RECEIVED, receivedAt: now };
    case ORDER_STATUS.ACEPTADO:
      return {
        ...base,
        type: ORDER_DOMAIN_EVENT.ORDER_ACCEPTED,
        receivedAt: now,
        acceptedAt: now,
      };
    case ORDER_STATUS.RECHAZADO:
      return {
        ...base,
        type: ORDER_DOMAIN_EVENT.ORDER_REJECTED,
        receivedAt: now,
        rejectedAt: now,
      };
    case ORDER_STATUS.EN_CAMINO:
      return {
        ...base,
        type: ORDER_DOMAIN_EVENT.ORDER_ON_THE_WAY,
        receivedAt: now,
        acceptedAt: now,
        onTheWayAt: now,
      };
    case ORDER_STATUS.FINALIZADO:
      return {
        ...base,
        type: ORDER_DOMAIN_EVENT.ORDER_FINISHED,
        receivedAt: now,
        acceptedAt: now,
        onTheWayAt: now,
        finishedAt: now,
      };
    case ORDER_STATUS.CANCELADO:
      return { ...base, type: ORDER_DOMAIN_EVENT.ORDER_CANCELLED, cancelledAt: now };
    case ORDER_STATUS.EXPIRADO:
      return { ...base, type: ORDER_DOMAIN_EVENT.ORDER_EXPIRED, expiredAt: now };
    default:
      return null;
  }
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

  const updated = await orderRepository.update(orderId, { status: result.value.status });
  const domainEvent = buildOrderDomainEvent(updated);
  if (domainEvent !== null) {
    eventBus.publish(domainEvent);
  }
  return updated;
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

  findByStore: async ({ storeId, status }: FindByStoreInput): Promise<readonly Order[]> => {
    await delay();
    return orderRepository.findAll({ storeId, status });
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
