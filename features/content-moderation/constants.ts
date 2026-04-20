export const REPORT_STATUS = Object.freeze({
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const);

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const REPORT_REASON = Object.freeze({
  INAPPROPRIATE: "INAPPROPRIATE",
  SPAM: "SPAM",
  MISLEADING: "MISLEADING",
  OTHER: "OTHER",
} as const);

export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

export const CONTENT_MODERATION_MOCK_DELAY_MS = 300 as const;
