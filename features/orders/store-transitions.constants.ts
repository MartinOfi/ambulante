export const STORE_ORDER_TRANSITION_ERROR_CODE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const);

export type StoreOrderTransitionErrorCode =
  (typeof STORE_ORDER_TRANSITION_ERROR_CODE)[keyof typeof STORE_ORDER_TRANSITION_ERROR_CODE];

export const ACCEPT_ORDER_ERROR_MESSAGE: Readonly<Record<StoreOrderTransitionErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos inválidos para aceptar el pedido.",
    ORDER_NOT_FOUND: "El pedido no existe o no es de tu tienda.",
    INVALID_TRANSITION: "Solo podés aceptar pedidos en estado Recibido.",
    INTERNAL_ERROR: "No se pudo aceptar el pedido. Reintentá en unos segundos.",
  });

export const REJECT_ORDER_ERROR_MESSAGE: Readonly<Record<StoreOrderTransitionErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos inválidos para rechazar el pedido.",
    ORDER_NOT_FOUND: "El pedido no existe o no es de tu tienda.",
    INVALID_TRANSITION: "Solo podés rechazar pedidos en estado Recibido.",
    INTERNAL_ERROR: "No se pudo rechazar el pedido. Reintentá en unos segundos.",
  });

export const FINALIZE_ORDER_ERROR_MESSAGE: Readonly<Record<StoreOrderTransitionErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos inválidos para finalizar el pedido.",
    ORDER_NOT_FOUND: "El pedido no existe o no es de tu tienda.",
    INVALID_TRANSITION: "Solo podés finalizar pedidos en estado En camino.",
    INTERNAL_ERROR: "No se pudo finalizar el pedido. Reintentá en unos segundos.",
  });
