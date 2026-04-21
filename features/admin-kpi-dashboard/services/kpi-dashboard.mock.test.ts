import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { kpiDashboardService } from "./kpi-dashboard.mock";

describe("kpiDashboardService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a KpiSnapshot with all 6 required fields", async () => {
    const promise = kpiDashboardService.fetchKpiSnapshot();
    vi.runAllTimers();
    const snapshot = await promise;

    expect(snapshot).not.toBeNull();
    expect(typeof snapshot.ordersPerDay).toBe("number");
    expect(typeof snapshot.acceptanceRate).toBe("number");
    expect(typeof snapshot.completionRate).toBe("number");
    expect(typeof snapshot.avgResponseTimeMs).toBe("number");
    expect(typeof snapshot.expirationRate).toBe("number");
    expect(typeof snapshot.activeStoresConcurrent).toBe("number");
  });

  it("returns rates between 0 and 1", async () => {
    const promise = kpiDashboardService.fetchKpiSnapshot();
    vi.runAllTimers();
    const snapshot = await promise;

    expect(snapshot.acceptanceRate).toBeGreaterThanOrEqual(0);
    expect(snapshot.acceptanceRate).toBeLessThanOrEqual(1);
    expect(snapshot.completionRate).toBeGreaterThanOrEqual(0);
    expect(snapshot.completionRate).toBeLessThanOrEqual(1);
    expect(snapshot.expirationRate).toBeGreaterThanOrEqual(0);
    expect(snapshot.expirationRate).toBeLessThanOrEqual(1);
  });

  it("returns non-negative numeric values", async () => {
    const promise = kpiDashboardService.fetchKpiSnapshot();
    vi.runAllTimers();
    const snapshot = await promise;

    expect(snapshot.ordersPerDay).toBeGreaterThanOrEqual(0);
    expect(snapshot.avgResponseTimeMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.activeStoresConcurrent).toBeGreaterThanOrEqual(0);
  });

  it("returns a computedAt Date", async () => {
    const promise = kpiDashboardService.fetchKpiSnapshot();
    vi.runAllTimers();
    const snapshot = await promise;

    expect(snapshot.computedAt).toBeInstanceOf(Date);
  });

  it("returns a valid period string", async () => {
    const promise = kpiDashboardService.fetchKpiSnapshot();
    vi.runAllTimers();
    const snapshot = await promise;

    expect(["day", "week", "month"]).toContain(snapshot.period);
  });
});
