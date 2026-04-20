export const FLAG_KEYS = {
  ENABLE_ORDERS: "enable_orders",
  ENABLE_REALTIME: "enable_realtime",
  ENABLE_PUSH_NOTIFICATIONS: "enable_push_notifications",
  ENABLE_STORE_DASHBOARD: "enable_store_dashboard",
} as const;

export type FlagKey = (typeof FLAG_KEYS)[keyof typeof FLAG_KEYS];

export const FLAG_DEFAULTS: Readonly<Record<FlagKey, boolean>> = Object.freeze({
  [FLAG_KEYS.ENABLE_ORDERS]: true,
  [FLAG_KEYS.ENABLE_REALTIME]: true,
  [FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]: false,
  [FLAG_KEYS.ENABLE_STORE_DASHBOARD]: true,
});
