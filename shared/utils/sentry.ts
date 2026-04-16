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
