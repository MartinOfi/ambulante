/**
 * Credenciales de usuarios seed para tests E2E.
 * Estos usuarios deben existir en Supabase local (creados por `pnpm supabase:seed:e2e`).
 */

export const E2E_USERS = {
  /** Cliente con historial de pedidos */
  client: {
    email: process.env.E2E_CLIENT_EMAIL ?? "cliente@dev.ambulante.local",
    password: process.env.E2E_CLIENT_PASSWORD ?? "Ambulante123!",
    name: "Ana García",
  },

  /** Tienda activa y aprobada, con catálogo cargado */
  store: {
    email: process.env.E2E_STORE_EMAIL ?? "tienda@dev.ambulante.local",
    password: process.env.E2E_STORE_PASSWORD ?? "Ambulante123!",
    name: "El Choripán de Pedro",
  },

  /** Tienda que completó onboarding pero aún no fue aprobada */
  storePending: {
    email: process.env.E2E_STORE_PENDING_EMAIL ?? "tienda-pendiente@dev.ambulante.local",
    password: process.env.E2E_STORE_PENDING_PASSWORD ?? "Ambulante123!",
  },

  /** Tienda rechazada con motivo de rechazo cargado */
  storeRejected: {
    email: process.env.E2E_STORE_REJECTED_EMAIL ?? "tienda-rechazada@dev.ambulante.local",
    password: process.env.E2E_STORE_REJECTED_PASSWORD ?? "Ambulante123!",
  },

  /** Admin con acceso a todas las secciones */
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@dev.ambulante.local",
    password: process.env.E2E_ADMIN_PASSWORD ?? "Ambulante123!",
  },
} as const;
