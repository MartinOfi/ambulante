/**
 * Constantes de estado de pedidos para assertions en tests E2E.
 * Refleja la máquina de estados del PRD §6.
 */

export const ORDER_STATUS_LABELS = {
  ENVIADO: "Enviado",
  RECIBIDO: "Recibido",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
  EN_CAMINO: "En camino",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
} as const;

/**
 * Tiempo de espera máximo (ms) para transiciones de estado vía Realtime.
 * Las actualizaciones llegan por Supabase Realtime y pueden tardar hasta 5s en local.
 */
export const REALTIME_TRANSITION_TIMEOUT_MS = 15_000;

/**
 * Tiempo de expiración de pedido en minutos (PRD §9.2).
 * Los tests del cron llaman directamente al endpoint /api/cron/expire-orders.
 */
export const ORDER_EXPIRATION_MINUTES = 10;
