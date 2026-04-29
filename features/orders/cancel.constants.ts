export const MAX_CANCEL_REASON_LENGTH = 500;

export const CANCEL_ORDER_ERROR_CODE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const);

export type CancelOrderErrorCode =
  (typeof CANCEL_ORDER_ERROR_CODE)[keyof typeof CANCEL_ORDER_ERROR_CODE];

export const CANCEL_ORDER_ERROR_MESSAGE: Readonly<Record<CancelOrderErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos inválidos para cancelar el pedido.",
    ORDER_NOT_FOUND: "El pedido no existe o no es tuyo.",
    // Reemplazado por getCancelRejectionMessage(currentStatus) cuando el RPC
    // devuelve currentStatus, pero queda como fallback.
    INVALID_TRANSITION: "No podés cancelar este pedido en su estado actual.",
    INTERNAL_ERROR: "No se pudo cancelar el pedido. Reintentá en unos segundos.",
  });
