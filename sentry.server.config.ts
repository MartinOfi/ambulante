import { initSentry } from "@/shared/utils/sentry";

export { initSentry as initSentryServer };

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
initSentry(dsn);
