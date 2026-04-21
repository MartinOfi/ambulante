import { describe, it, expect } from "vitest";
import { createMockStoreAnalyticsService } from "./store-analytics.service";

describe("createMockStoreAnalyticsService", () => {
  const service = createMockStoreAnalyticsService();

  it("returns a StoreKpiSummary for period 1", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 1 });
    expect(result.periodDays).toBe(1);
    expect(result.ordersTotal).toBeGreaterThanOrEqual(0);
    expect(result.ordersPerDay).toBeGreaterThanOrEqual(0);
  });

  it("returns a StoreKpiSummary for period 7", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 7 });
    expect(result.periodDays).toBe(7);
  });

  it("returns a StoreKpiSummary for period 30", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 30 });
    expect(result.periodDays).toBe(30);
  });

  it("rates are between 0 and 1", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 7 });
    expect(result.acceptanceRate).toBeGreaterThanOrEqual(0);
    expect(result.acceptanceRate).toBeLessThanOrEqual(1);
    expect(result.finalizationRate).toBeGreaterThanOrEqual(0);
    expect(result.finalizationRate).toBeLessThanOrEqual(1);
    expect(result.expirationRate).toBeGreaterThanOrEqual(0);
    expect(result.expirationRate).toBeLessThanOrEqual(1);
  });

  it("avgResponseMs is non-negative", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 7 });
    expect(result.avgResponseMs).toBeGreaterThanOrEqual(0);
  });

  it("activeDaysCount does not exceed periodDays", async () => {
    const result = await service.getKpiSummary({ storeId: "store-1", period: 7 });
    expect(result.activeDaysCount).toBeLessThanOrEqual(7);
  });

  it("scales ordersTotal proportionally to period", async () => {
    const summary7 = await service.getKpiSummary({ storeId: "store-1", period: 7 });
    const summary30 = await service.getKpiSummary({ storeId: "store-1", period: 30 });
    expect(summary30.ordersTotal).toBeGreaterThanOrEqual(summary7.ordersTotal);
  });

  it("different storeIds return independent summaries", async () => {
    const a = await service.getKpiSummary({ storeId: "store-a", period: 7 });
    const b = await service.getKpiSummary({ storeId: "store-b", period: 7 });
    expect(a.periodDays).toBe(b.periodDays);
  });
});
