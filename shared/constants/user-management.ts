/**
 * Constants for user suspension management.
 * Source of truth: PRD §9.5 (moderación).
 */

export const USER_SUSPENSION_STATUS = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const);

export type UserSuspensionStatus =
  (typeof USER_SUSPENSION_STATUS)[keyof typeof USER_SUSPENSION_STATUS];
