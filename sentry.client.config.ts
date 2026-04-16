import { initSentry } from "@/shared/utils/sentry";

export { initSentry as initSentryClient };

initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);
