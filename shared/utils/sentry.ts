import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

export function initSentry(dsn: string | undefined): void {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: process.env.NODE_ENV === "production",
    debug: false,
  });

  logger.registerErrorHook((message, context) => {
    Sentry.captureException(new Error(message), { extra: context });
  });
}

export interface SlowQueryAlertPayload {
  readonly queryid: string;
  readonly meanExecTimeMs: number;
  readonly calls: number;
  readonly totalExecTimeMs: number;
  readonly queryText: string;
  readonly baselineMeanMs: number | null;
  readonly breachKind: "absolute" | "regression" | "absolute_and_regression";
  readonly requestId: string;
}

// Slow queries are warnings, not errors — they don't break a request, they just
// hint that something needs attention. captureMessage with level=warning keeps
// them visible in Sentry without polluting the error feed.
export function reportSlowQuery(payload: SlowQueryAlertPayload): void {
  Sentry.captureMessage("slow-query-detected", {
    level: "warning",
    tags: {
      breach_kind: payload.breachKind,
      request_id: payload.requestId,
    },
    extra: { ...payload },
  });
}
