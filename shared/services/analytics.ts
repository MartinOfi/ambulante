import { track as vercelTrack } from "@vercel/analytics";
import { logger } from "@/shared/utils/logger";
import {
  analyticsEventSchemas,
  type AnalyticsEventMap,
  type AnalyticsEventName,
} from "@/shared/constants/analytics-events";

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;

export interface AnalyticsTransport {
  send(name: string, props: Record<string, AnalyticsPropertyValue>): void;
}

export interface AnalyticsService {
  track<E extends AnalyticsEventName>(event: E, props: AnalyticsEventMap[E]): void;
}

export function createAnalyticsService(transport: AnalyticsTransport): AnalyticsService {
  return {
    track<E extends AnalyticsEventName>(event: E, props: AnalyticsEventMap[E]): void {
      const schema = analyticsEventSchemas[event];
      const result = schema.safeParse(props);
      if (!result.success) {
        logger.error("Invalid analytics props", { event, issues: result.error.issues });
        throw result.error;
      }
      transport.send(event, result.data as Record<string, AnalyticsPropertyValue>);
    },
  };
}

// ── Transports ────────────────────────────────────────────────────────────────

const vercelTransport: AnalyticsTransport = {
  send(name, props) {
    vercelTrack(name, props);
  },
};

const devTransport: AnalyticsTransport = {
  send(name, props) {
    logger.debug("analytics.track", { name, props });
  },
};

const isProduction = process.env.NODE_ENV === "production";

export const analyticsService: AnalyticsService = createAnalyticsService(
  isProduction ? vercelTransport : devTransport,
);
