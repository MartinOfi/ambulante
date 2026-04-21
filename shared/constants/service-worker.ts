export const SW_MESSAGE_TYPE = Object.freeze({
  SKIP_WAITING: "SKIP_WAITING",
} as const);

export type SwMessageType = (typeof SW_MESSAGE_TYPE)[keyof typeof SW_MESSAGE_TYPE];

export const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const SW_UPDATE_STATUS = Object.freeze({
  IDLE: "idle",
  AVAILABLE: "available",
  DISMISSED: "dismissed",
  APPLYING: "applying",
} as const);

export type SwUpdateStatus = (typeof SW_UPDATE_STATUS)[keyof typeof SW_UPDATE_STATUS];
