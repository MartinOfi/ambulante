/**
 * Domain constants for orders.
 * Source of truth: PRD §6 (state machine) and §9.2 (timeouts).
 */

export const ORDER_STATUS = Object.freeze({
  ENVIADO: "ENVIADO",
  RECIBIDO: "RECIBIDO",
  ACEPTADO: "ACEPTADO",
  RECHAZADO: "RECHAZADO",
  EN_CAMINO: "EN_CAMINO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
  EXPIRADO: "EXPIRADO",
} as const);

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * States from which no further transitions are allowed (PRD §6.2).
 * Checking membership here prevents accidental mutations on terminal orders.
 */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = Object.freeze([
  ORDER_STATUS.CANCELADO,
  ORDER_STATUS.RECHAZADO,
  ORDER_STATUS.FINALIZADO,
  ORDER_STATUS.EXPIRADO,
]);

/** Minutes before an unanswered order is automatically expired (PRD §9.2). */
export const ORDER_EXPIRATION_MINUTES = 10 as const;

/** Hours before an accepted-but-unclosed order is auto-closed (PRD §9.2). */
export const ORDER_AUTOCLOSE_HOURS = 2 as const;
