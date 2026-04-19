export const LOCATION_PERMISSION_STATUS = {
  GRANTED: "granted",
  DENIED: "denied",
  PROMPT: "prompt",
  UNSUPPORTED: "unsupported",
} as const;

export type LocationPermissionStatus =
  (typeof LOCATION_PERMISSION_STATUS)[keyof typeof LOCATION_PERMISSION_STATUS];

export const NOTIFICATION_PERMISSION = {
  DEFAULT: "default",
  GRANTED: "granted",
  DENIED: "denied",
  UNSUPPORTED: "unsupported",
} as const;

export type NotificationPermission =
  (typeof NOTIFICATION_PERMISSION)[keyof typeof NOTIFICATION_PERMISSION];

export const NOTIFICATION_PREF_KEYS = {
  ORDER_UPDATES: "orderUpdates",
  STORE_ARRIVAL: "storeArrival",
  MARKETING: "marketing",
} as const;

export type NotificationPrefKey =
  (typeof NOTIFICATION_PREF_KEYS)[keyof typeof NOTIFICATION_PREF_KEYS];

export const NOTIFICATION_PREFS_STORAGE_KEY = "ambulante:notification-prefs";
