export const STORE_VALIDATION_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export const REJECTION_REASON_MIN_LENGTH = 10;
export const REJECTION_REASON_MAX_LENGTH = 500;
