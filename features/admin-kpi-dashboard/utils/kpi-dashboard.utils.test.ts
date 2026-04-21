import { describe, it, expect } from "vitest";
import {
  formatRate,
  formatResponseTime,
  rateStatus,
  invertedRateStatus,
  timeStatus,
  buildKpiCards,
} from "./kpi-dashboard.utils";
import { KPI_TARGETS } from "@/features/admin-kpi-dashboard/constants/kpi-dashboard.constants";
import type { KpiSnapshot } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const snapshot: KpiSnapshot = {
  ordersPerDay: 42,
  acceptanceRate: 0.72,
  completionRate: 0.65,
  avgResponseTimeMs: 142_000,
  expirationRate: 0.12,
  activeStoresConcurrent: 8,
  period: "day",
  computedAt: new Date(),
};

describe("formatRate", () => {
  it("formats 0.72 as '72%'", () => {
    expect(formatRate(0.72)).toBe("72%");
  });

  it("rounds 0.725 to '73%'", () => {
    expect(formatRate(0.725)).toBe("73%");
  });
});

describe("formatResponseTime", () => {
  it("formats seconds-only when under 1 minute", () => {
    expect(formatResponseTime(45_000)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatResponseTime(142_000)).toBe("2m 22s");
  });
});

describe("rateStatus threshold boundaries", () => {
  it("returns on-target at exactly the minimum", () => {
    expect(rateStatus(KPI_TARGETS.ACCEPTANCE_RATE_MIN, KPI_TARGETS.ACCEPTANCE_RATE_MIN)).toBe(
      "on-target",
    );
  });

  it("returns below-target just below the minimum", () => {
    expect(rateStatus(0.599, KPI_TARGETS.ACCEPTANCE_RATE_MIN)).toBe("below-target");
  });
});

describe("invertedRateStatus threshold boundaries", () => {
  it("returns on-target at exactly the maximum", () => {
    expect(
      invertedRateStatus(KPI_TARGETS.EXPIRATION_RATE_MAX, KPI_TARGETS.EXPIRATION_RATE_MAX),
    ).toBe("on-target");
  });

  it("returns below-target just above the maximum", () => {
    expect(invertedRateStatus(0.151, KPI_TARGETS.EXPIRATION_RATE_MAX)).toBe("below-target");
  });
});

describe("timeStatus threshold boundaries", () => {
  it("returns on-target at exactly the maximum", () => {
    expect(
      timeStatus(KPI_TARGETS.AVG_RESPONSE_TIME_MAX_MS, KPI_TARGETS.AVG_RESPONSE_TIME_MAX_MS),
    ).toBe("on-target");
  });

  it("returns below-target just above the maximum", () => {
    expect(timeStatus(180_001, KPI_TARGETS.AVG_RESPONSE_TIME_MAX_MS)).toBe("below-target");
  });
});

describe("buildKpiCards", () => {
  it("returns exactly 6 cards", () => {
    expect(buildKpiCards(snapshot)).toHaveLength(6);
  });

  it("acceptance rate below target maps to below-target status", () => {
    const cards = buildKpiCards({ ...snapshot, acceptanceRate: 0.59 });
    const card = cards.find((c) => c.label === "Tasa de aceptación");
    expect(card?.status).toBe("below-target");
  });

  it("acceptance rate on target maps to on-target status", () => {
    const cards = buildKpiCards({ ...snapshot, acceptanceRate: 0.6 });
    const card = cards.find((c) => c.label === "Tasa de aceptación");
    expect(card?.status).toBe("on-target");
  });

  it("expiration rate above threshold maps to below-target status", () => {
    const cards = buildKpiCards({ ...snapshot, expirationRate: 0.16 });
    const card = cards.find((c) => c.label === "Tasa de expiración");
    expect(card?.status).toBe("below-target");
  });

  it("response time above threshold maps to below-target status", () => {
    const cards = buildKpiCards({ ...snapshot, avgResponseTimeMs: 200_000 });
    const card = cards.find((c) => c.label === "Tiempo de respuesta");
    expect(card?.status).toBe("below-target");
  });
});
