import { ORDER_ACTOR, ORDER_EVENT, transition } from "@/shared/domain/order-state-machine";
import type { Order, OrderEvent } from "@/shared/domain/order-state-machine";
import { orderRepository } from "@/shared/repositories";
import { logger } from "@/shared/utils/logger";
import type { OrdersService } from "./orders.service";

const MOCK_NETWORK_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
}

async function applyTransition({
  orderId,
  event,
  errorContext,
}: {
  readonly orderId: string;
  readonly event: OrderEvent;
  readonly errorContext: string;
}): Promise<Order> {
  await delay();

  // The repository stores the persistence model (Order from schemas/order).
  // The state machine operates on the domain model (Order from domain/order-state-machine).
  // For the mock, we treat the status field as interchangeable since both share status strings.
  // The domain Order type is a superset with Date timestamps — the mock reconstructs them.
  const persisted = await orderRepository.findById(orderId);
  if (persisted === null) {
    logger.error(`${errorContext}: order not found`, { orderId });
    throw new Error(`Order "${orderId}" not found`);
  }

  // Reconstruct domain Order from persistence model for the state machine.
  // Dates are stored as ISO strings in the repo; convert them here.
  const domainOrder: Order = {
    id: persisted.id,
    clientId: persisted.clientId,
    storeId: persisted.storeId,
    sentAt: new Date(persisted.createdAt),
    // The status cast is safe: both models share the same ORDER_STATUS string literals.
    status: persisted.status as Order["status"],
  } as Order;

  const result = transition({ order: domainOrder, event, actor: ORDER_ACTOR.TIENDA });

  if (!result.ok) {
    logger.error(`${errorContext}: invalid transition`, { orderId, error: result.error });
    throw new Error(`Transition failed: ${result.error.kind}`);
  }

  const updated = await orderRepository.update(orderId, { status: result.value.status });

  // Return domain Order reconstructed from updated persistence record.
  return { ...result.value, id: updated.id } as Order;
}

export const ordersService: OrdersService = {
  accept: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = {
      type: ORDER_EVENT.TIENDA_ACEPTA,
      occurredAt: new Date(),
    };
    return applyTransition({ orderId, event, errorContext: "ordersService.accept" });
  },

  reject: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = {
      type: ORDER_EVENT.TIENDA_RECHAZA,
      occurredAt: new Date(),
    };
    return applyTransition({ orderId, event, errorContext: "ordersService.reject" });
  },

  finalize: async (orderId: string): Promise<Order> => {
    const event: OrderEvent = {
      type: ORDER_EVENT.TIENDA_FINALIZA,
      occurredAt: new Date(),
    };
    return applyTransition({ orderId, event, errorContext: "ordersService.finalize" });
  },
};
