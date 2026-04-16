import * as Sentry from "@sentry/nextjs";
import { logger } from "@/shared/utils/logger";

export function initSentryClient(dsn: string | undefined): void {
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

initSentryClient(process.env.NEXT_PUBLIC_SENTRY_DSN);
