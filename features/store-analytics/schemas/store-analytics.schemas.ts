import { z } from "zod";

export const analyticsPeriodSchema = z.union([z.literal(1), z.literal(7), z.literal(30)]);

export const storeKpiSummarySchema = z.object({
  periodDays: analyticsPeriodSchema,
  ordersTotal: z.number().int().nonnegative(),
  ordersPerDay: z.number().nonnegative(),
  acceptanceRate: z.number().min(0).max(1),
  finalizationRate: z.number().min(0).max(1),
  avgResponseMs: z.number().nonnegative(),
  expirationRate: z.number().min(0).max(1),
  activeDaysCount: z.number().int().nonnegative(),
});

export type StoreKpiSummarySchema = z.infer<typeof storeKpiSummarySchema>;
