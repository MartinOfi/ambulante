import type {
  StoreKpiSummary,
  StoreAnalyticsFilter,
} from "@/features/store-analytics/types/store-analytics.types";

export interface StoreAnalyticsService {
  getKpiSummary(filter: StoreAnalyticsFilter): Promise<StoreKpiSummary>;
}

// Deterministic pseudo-hash so each storeId gets stable mock values
function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function lerp(hash: number, min: number, max: number): number {
  return min + ((hash % 1000) / 1000) * (max - min);
}

export function createMockStoreAnalyticsService(): StoreAnalyticsService {
  return {
    async getKpiSummary({ storeId, period }: StoreAnalyticsFilter): Promise<StoreKpiSummary> {
      const seed = stableHash(storeId);

      const acceptanceRate = parseFloat(lerp(seed, 0.45, 0.85).toFixed(2));
      const finalizationRate = parseFloat(lerp(stableHash(storeId + "fin"), 0.55, 0.9).toFixed(2));
      const expirationRate = parseFloat(lerp(stableHash(storeId + "exp"), 0.02, 0.2).toFixed(2));
      const avgResponseMs = Math.round(lerp(stableHash(storeId + "resp"), 60_000, 300_000));
      const baseOrdersPerDay = parseFloat(lerp(stableHash(storeId + "ord"), 2, 25).toFixed(1));
      const ordersTotal = Math.round(baseOrdersPerDay * period);
      const ordersPerDay = parseFloat((ordersTotal / period).toFixed(1));
      const activeDaysCount = Math.min(
        period,
        Math.round(lerp(stableHash(storeId + "act"), period * 0.5, period)),
      );

      return {
        periodDays: period,
        ordersTotal,
        ordersPerDay,
        acceptanceRate,
        finalizationRate,
        expirationRate,
        avgResponseMs,
        activeDaysCount,
      };
    },
  };
}

export const storeAnalyticsService: StoreAnalyticsService = createMockStoreAnalyticsService();
