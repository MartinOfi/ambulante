export const AUDIT_LOG_MOCK_DELAY_MS = 400 as const;

export const AUDIT_LOG_MAX_ORDER_ID_LENGTH = 128 as const;

export const AUDIT_LOG_ACTOR_LABEL = {
  CLIENTE: "Cliente",
  TIENDA: "Tienda",
  SISTEMA: "Sistema",
} as const;

export const AUDIT_LOG_STATUS_LABEL = {
  ENVIADO: "Enviado",
  RECIBIDO: "Recibido",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
  EN_CAMINO: "En camino",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
} as const;
