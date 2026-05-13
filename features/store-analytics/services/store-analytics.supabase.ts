import { orderRepository } from "@/shared/repositories";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { StoreAnalyticsService } from "./store-analytics.service";
import type {
  StoreKpiSummary,
  StoreAnalyticsFilter,
} from "@/features/store-analytics/types/store-analytics.types";

function toDateStart(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const supabaseStoreAnalyticsService: StoreAnalyticsService = {
  async getKpiSummary({ storeId, period }: StoreAnalyticsFilter): Promise<StoreKpiSummary> {
    const allOrders = await orderRepository.findAll({ storeId });
    const since = toDateStart(period);

    const orders = allOrders.filter((o) => new Date(o.createdAt) >= since);
    const total = orders.length;

    if (total === 0) {
      return {
        periodDays: period,
        ordersTotal: 0,
        ordersPerDay: 0,
        acceptanceRate: 0,
        finalizationRate: 0,
        avgResponseMs: 0,
        expirationRate: 0,
        activeDaysCount: 0,
      };
    }

    const accepted = orders.filter(
      (o) =>
        o.status === ORDER_STATUS.ACEPTADO ||
        o.status === ORDER_STATUS.EN_CAMINO ||
        o.status === ORDER_STATUS.FINALIZADO,
    ).length;

    const finalized = orders.filter((o) => o.status === ORDER_STATUS.FINALIZADO).length;
    const expired = orders.filter((o) => o.status === ORDER_STATUS.EXPIRADO).length;

    // avgResponseMs: approximated as updatedAt - createdAt for RECIBIDO orders
    // (best proxy available without per-transition timestamps)
    const receivedOrders = orders.filter((o) => o.status === ORDER_STATUS.RECIBIDO);
    const avgResponseMs =
      receivedOrders.length > 0
        ? receivedOrders.reduce(
            (sum, o) => sum + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()),
            0,
          ) / receivedOrders.length
        : 0;

    const activeDays = new Set(orders.map((o) => isoDay(new Date(o.createdAt)))).size;

    return {
      periodDays: period,
      ordersTotal: total,
      ordersPerDay: parseFloat((total / period).toFixed(1)),
      acceptanceRate: parseFloat((accepted / total).toFixed(2)),
      finalizationRate: parseFloat((finalized / total).toFixed(2)),
      avgResponseMs: Math.round(avgResponseMs),
      expirationRate: parseFloat((expired / total).toFixed(2)),
      activeDaysCount: activeDays,
    };
  },
};
