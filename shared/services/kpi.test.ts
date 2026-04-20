import { describe, it, expect, beforeEach } from "vitest";
import { createKpiService } from "@/shared/services/kpi";
import type { AnalyticsService } from "@/shared/services/analytics";

function makeMockAnalytics(): AnalyticsService & {
  calls: Array<{ event: string; props: unknown }>;
} {
  const calls: Array<{ event: string; props: unknown }> = [];
  return {
    calls,
    track(event, props) {
      calls.push({ event, props });
    },
  };
}

describe("createKpiService", () => {
  let analytics: ReturnType<typeof makeMockAnalytics>;

  beforeEach(() => {
    analytics = makeMockAnalytics();
  });

  describe("trackOrderSent", () => {
    it("delegates to analytics with storeId and itemCount", () => {
      const kpi = createKpiService(analytics);
      kpi.trackOrderSent({ storeId: "s1", itemCount: 3 });

      expect(analytics.calls).toHaveLength(1);
      expect(analytics.calls[0]?.event).toBe("ORDER_SENT");
      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s1", itemCount: 3 });
    });
  });

  describe("trackOrderAccepted", () => {
    it("computes waitMs from receivedAt and acceptedAt", () => {
      const kpi = createKpiService(analytics);
      const receivedAt = new Date("2026-01-01T10:00:00Z");
      const acceptedAt = new Date("2026-01-01T10:01:30Z"); // 90 seconds later

      kpi.trackOrderAccepted({ storeId: "s1", receivedAt, acceptedAt });

      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s1", waitMs: 90_000 });
    });

    it("accepts acceptedAt equal to receivedAt (instant acceptance)", () => {
      const kpi = createKpiService(analytics);
      const now = new Date();
      kpi.trackOrderAccepted({ storeId: "s1", receivedAt: now, acceptedAt: now });

      expect(analytics.calls[0]?.props).toMatchObject({ waitMs: 0 });
    });
  });

  describe("trackOrderRejected", () => {
    it("delegates with storeId and optional reason", () => {
      const kpi = createKpiService(analytics);
      kpi.trackOrderRejected({ storeId: "s2", reason: "store_closed" });

      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s2", reason: "store_closed" });
    });

    it("works without reason", () => {
      const kpi = createKpiService(analytics);
      kpi.trackOrderRejected({ storeId: "s2" });

      expect(analytics.calls[0]?.event).toBe("ORDER_REJECTED");
    });
  });

  describe("trackOrderExpired", () => {
    it("delegates with storeId", () => {
      const kpi = createKpiService(analytics);
      kpi.trackOrderExpired({ storeId: "s3" });

      expect(analytics.calls[0]?.event).toBe("ORDER_EXPIRED");
      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s3" });
    });
  });

  describe("trackOrderFinalized", () => {
    it("computes totalMs from acceptedAt and finalizedAt", () => {
      const kpi = createKpiService(analytics);
      const acceptedAt = new Date("2026-01-01T10:00:00Z");
      const finalizedAt = new Date("2026-01-01T10:15:00Z"); // 15 minutes later

      kpi.trackOrderFinalized({ storeId: "s4", acceptedAt, finalizedAt });

      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s4", totalMs: 900_000 });
    });
  });

  describe("trackStoreAvailabilityChanged", () => {
    it("tracks store going available", () => {
      const kpi = createKpiService(analytics);
      kpi.trackStoreAvailabilityChanged({ storeId: "s5", available: true });

      expect(analytics.calls[0]?.event).toBe("STORE_AVAILABILITY_CHANGED");
      expect(analytics.calls[0]?.props).toMatchObject({ storeId: "s5", available: true });
    });

    it("tracks store going unavailable", () => {
      const kpi = createKpiService(analytics);
      kpi.trackStoreAvailabilityChanged({ storeId: "s5", available: false });

      expect(analytics.calls[0]?.props).toMatchObject({ available: false });
    });
  });
});
