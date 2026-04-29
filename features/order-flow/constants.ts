// Boundaries para inputs del cliente al armar un pedido. Sirven tanto a la
// validación Zod como a los mensajes de UI traducidos.

export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_ITEMS_PER_ORDER = 50;
export const MAX_NOTE_LENGTH = 500;

export const SUBMIT_ORDER_ERROR_CODE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  STORE_UNAVAILABLE: "STORE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const);

export type SubmitOrderErrorCode =
  (typeof SUBMIT_ORDER_ERROR_CODE)[keyof typeof SUBMIT_ORDER_ERROR_CODE];

export const SUBMIT_ORDER_ERROR_MESSAGE: Readonly<Record<SubmitOrderErrorCode, string>> =
  Object.freeze({
    UNAUTHENTICATED: "Sesión no válida. Iniciá sesión nuevamente.",
    VALIDATION_ERROR: "Datos del pedido no válidos.",
    PRODUCT_UNAVAILABLE: "Algún producto del pedido ya no está disponible.",
    STORE_UNAVAILABLE: "La tienda no está disponible.",
    INTERNAL_ERROR: "No se pudo crear el pedido. Reintentá en unos segundos.",
  });
