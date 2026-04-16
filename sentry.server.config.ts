import * as Sentry from "@sentry/nextjs";
import { logger } from "@/shared/utils/logger";

export function initSentryServer(dsn: string | undefined): void {
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

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
initSentryServer(dsn);
