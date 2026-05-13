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
  accept: (orderId: string): Promise<Order> =>
    applyTransition({
      orderId,
      event: { type: ORDER_EVENT.TIENDA_ACEPTA, occurredAt: new Date() },
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.accept",
    }),

  reject: (orderId: string): Promise<Order> =>
    applyTransition({
      orderId,
      event: { type: ORDER_EVENT.TIENDA_RECHAZA, occurredAt: new Date() },
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.reject",
    }),

  finalize: (orderId: string): Promise<Order> =>
    applyTransition({
      orderId,
      event: { type: ORDER_EVENT.TIENDA_FINALIZA, occurredAt: new Date() },
      actor: ORDER_ACTOR.TIENDA,
      errorContext: "ordersService.finalize",
    }),

  cancel: (orderId: string): Promise<Order> =>
    applyTransition({
      orderId,
      event: { type: ORDER_EVENT.CLIENTE_CANCELA, occurredAt: new Date() },
      actor: ORDER_ACTOR.CLIENTE,
      errorContext: "ordersService.cancel",
    }),

  confirmOnTheWay: (orderId: string): Promise<Order> =>
    applyTransition({
      orderId,
      event: { type: ORDER_EVENT.CLIENTE_CONFIRMA_CAMINO, occurredAt: new Date() },
      actor: ORDER_ACTOR.CLIENTE,
      errorContext: "ordersService.confirmOnTheWay",
    }),

  findByUser: ({ clientId, status }: FindByUserInput): Promise<readonly Order[]> =>
    orderRepository.findAll({ clientId, status }),

  findByStore: ({ storeId, status }: FindByStoreInput): Promise<readonly Order[]> =>
    orderRepository.findAll({ storeId, status }),

  send: (_input: SendOrderInput): Promise<Order> => {
    throw new Error(
      "ordersService.send is not available in production — use submitOrder Server Action",
    );
  },

  getById: (orderId: string): Promise<Order | null> => orderRepository.findById(orderId),
};
