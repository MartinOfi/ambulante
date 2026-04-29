import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";

const CUSTOMER_CANCELLABLE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  ORDER_STATUS.ENVIADO,
  ORDER_STATUS.RECIBIDO,
]);

// Per PRD §7.1: el cliente puede cancelar sólo antes de que la tienda haya
// aceptado el pedido. Una vez ACEPTADO/EN_CAMINO/FINALIZADO, la cancelación
// queda fuera del control del cliente.
export function canCancelFromCustomer(status: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE_STATUSES.has(status);
}

// Mensaje human-readable para el caso en que la transición no es válida.
// Discrimina entre "ya está aceptado" y "ya está cerrado" porque la UX es
// distinta: en el primer caso el cliente puede pedirle a la tienda que
// cancele; en el segundo, el pedido ya terminó (terminal state).
const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  ORDER_STATUS.FINALIZADO,
  ORDER_STATUS.CANCELADO,
  ORDER_STATUS.RECHAZADO,
  ORDER_STATUS.EXPIRADO,
]);

export function getCancelRejectionMessage(currentStatus: OrderStatus): string {
  if (TERMINAL_STATUSES.has(currentStatus)) return "Este pedido ya está cerrado.";
  return "No podés cancelar después de que la tienda aceptó el pedido.";
}
