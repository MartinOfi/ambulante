/**
 * Datos de productos usados en tests E2E de catálogo (UC-STO-11 a UC-STO-16).
 */

export const CATALOG_TEST_PRODUCT = {
  new: {
    name: "Empanada criolla E2E",
    description: "Jugosa empanada de carne cortada a cuchillo",
    priceArs: 800,
  },
  updated: {
    name: "Empanada editada E2E",
    description: "Versión grande de la empanada de carne",
    priceArs: 1200,
  },
} as const;

/** Precio negativo — debe ser rechazado por el formulario */
export const INVALID_PRODUCT_PRICE = -100;

/** Nombre vacío — debe ser rechazado por el formulario */
export const EMPTY_PRODUCT_NAME = "";
