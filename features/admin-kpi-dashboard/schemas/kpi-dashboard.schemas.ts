import { z } from "zod";

const kpiPeriodSchema = z.enum(["day", "week", "month"]);

export const kpiSnapshotSchema = z.object({
  ordersPerDay: z.number().nonnegative(),
  acceptanceRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  avgResponseTimeMs: z.number().nonnegative(),
  expirationRate: z.number().min(0).max(1),
  activeStoresConcurrent: z.number().nonnegative().int(),
  period: kpiPeriodSchema,
  computedAt: z.date(),
});
