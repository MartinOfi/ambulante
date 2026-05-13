/**
 * Datos de tiendas usadas en tests E2E.
 * La tienda aprobada debe tener al menos un producto activo en su catálogo.
 */

export const E2E_STORES = {
  /** Tienda activa, aprobada y con productos cargados */
  approved: {
    name: "El Choripán de Pedro",
    kind: "food-truck" as const,
    geo: { latitude: -34.5779, longitude: -58.4328 },
    product: {
      name: "Choripán simple",
      priceArs: 1500,
    },
  },

  /** Tienda que completó el onboarding pero espera validación admin */
  pending: {
    name: "Empanadas La Porteña",
    kind: "street-cart" as const,
    cuit: "20304050609",
    neighborhood: "Palermo",
  },

  /** Tienda rechazada — el admin cargó un motivo de rechazo */
  rejected: {
    name: "Helados del Sur",
    kind: "ice-cream" as const,
    rejectionReason: "Documentación incompleta: falta habilitación comercial",
  },
} as const;

/**
 * Datos válidos para completar el formulario de onboarding de una tienda nueva.
 * Usar con el flujo UC-STO-01 → UC-STO-03 y UC-FLOW-06.
 */
export const ONBOARDING_DATA = {
  step1: {
    businessName: "Tacos María",
    kind: "food-truck",
    cuit: "20304050609",
  },
  step2: {
    neighborhood: "Villa Crespo",
    coverageNotes: "Radio de 5 cuadras alrededor de la plaza",
  },
  step3: {
    days: ["lunes", "martes", "miercoles", "jueves", "viernes"],
    openTime: "11:00",
    closeTime: "20:00",
  },
} as const;

/** CUIT con dígito verificador incorrecto — debe ser rechazado por el formulario */
export const INVALID_CUIT = "20304050602";
