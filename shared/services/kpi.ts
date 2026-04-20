import { ANALYTICS_EVENT } from "@/shared/constants/analytics-events";
import type { AnalyticsService } from "@/shared/services/analytics";
import { analyticsService } from "@/shared/services/analytics";

// ── Input interfaces ──────────────────────────────────────────────────────────

export interface TrackOrderSentInput {
  readonly storeId: string;
  readonly itemCount: number;
}

export interface TrackOrderAcceptedInput {
  readonly storeId: string;
  readonly receivedAt: Date;
  readonly acceptedAt: Date;
}

export interface TrackOrderRejectedInput {
  readonly storeId: string;
  readonly reason?: string;
}

export interface TrackOrderExpiredInput {
  readonly storeId: string;
}

export interface TrackOrderFinalizedInput {
  readonly storeId: string;
  readonly acceptedAt: Date;
  readonly finalizedAt: Date;
}

export interface TrackStoreAvailabilityChangedInput {
  readonly storeId: string;
  readonly available: boolean;
}

// ── Service interface ─────────────────────────────────────────────────────────

export interface KpiService {
  trackOrderSent(input: TrackOrderSentInput): void;
  trackOrderAccepted(input: TrackOrderAcceptedInput): void;
  trackOrderRejected(input: TrackOrderRejectedInput): void;
  trackOrderExpired(input: TrackOrderExpiredInput): void;
  trackOrderFinalized(input: TrackOrderFinalizedInput): void;
  trackStoreAvailabilityChanged(input: TrackStoreAvailabilityChangedInput): void;
}

// ── Pure timing helpers ───────────────────────────────────────────────────────

export function computeDeltaMs(from: Date, to: Date): number {
  return to.getTime() - from.getTime();
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createKpiService(analytics: AnalyticsService): KpiService {
  return {
    trackOrderSent({ storeId, itemCount }) {
      analytics.track(ANALYTICS_EVENT.ORDER_SENT, { storeId, itemCount });
    },

    trackOrderAccepted({ storeId, receivedAt, acceptedAt }) {
      const waitMs = computeDeltaMs(receivedAt, acceptedAt);
      analytics.track(ANALYTICS_EVENT.ORDER_ACCEPTED, { storeId, waitMs });
    },

    trackOrderRejected({ storeId, reason }) {
      analytics.track(ANALYTICS_EVENT.ORDER_REJECTED, { storeId, reason });
    },

    trackOrderExpired({ storeId }) {
      analytics.track(ANALYTICS_EVENT.ORDER_EXPIRED, { storeId });
    },

    trackOrderFinalized({ storeId, acceptedAt, finalizedAt }) {
      const totalMs = computeDeltaMs(acceptedAt, finalizedAt);
      analytics.track(ANALYTICS_EVENT.ORDER_FINISHED, { storeId, totalMs });
    },

    trackStoreAvailabilityChanged({ storeId, available }) {
      analytics.track(ANALYTICS_EVENT.STORE_AVAILABILITY_CHANGED, { storeId, available });
    },
  };
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const kpiService: KpiService = createKpiService(analyticsService);
