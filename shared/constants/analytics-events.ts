import { z } from "zod";

export const ANALYTICS_EVENT = {
  ORDER_SENT: "ORDER_SENT",
  ORDER_ACCEPTED: "ORDER_ACCEPTED",
  ORDER_REJECTED: "ORDER_REJECTED",
  ORDER_ON_THE_WAY: "ORDER_ON_THE_WAY",
  ORDER_FINISHED: "ORDER_FINISHED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  ORDER_EXPIRED: "ORDER_EXPIRED",
  STORE_VIEWED: "STORE_VIEWED",
  MAP_OPENED: "MAP_OPENED",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

// ── Per-event payload schemas ─────────────────────────────────────────────────

const orderBaseSchema = z.object({ storeId: z.string() });

export const analyticsEventSchemas = {
  [ANALYTICS_EVENT.ORDER_SENT]: orderBaseSchema.extend({
    itemCount: z.number().int().positive(),
  }),
  [ANALYTICS_EVENT.ORDER_ACCEPTED]: orderBaseSchema.extend({
    waitMs: z.number().nonnegative().optional(),
  }),
  [ANALYTICS_EVENT.ORDER_REJECTED]: orderBaseSchema.extend({
    reason: z.string().optional(),
  }),
  [ANALYTICS_EVENT.ORDER_ON_THE_WAY]: orderBaseSchema,
  [ANALYTICS_EVENT.ORDER_FINISHED]: orderBaseSchema.extend({
    totalMs: z.number().nonnegative().optional(),
  }),
  [ANALYTICS_EVENT.ORDER_CANCELLED]: orderBaseSchema,
  [ANALYTICS_EVENT.ORDER_EXPIRED]: orderBaseSchema,
  [ANALYTICS_EVENT.STORE_VIEWED]: z.object({ storeId: z.string() }),
  [ANALYTICS_EVENT.MAP_OPENED]: z.object({}),
} as const satisfies Record<AnalyticsEventName, z.ZodTypeAny>;

export type AnalyticsEventMap = {
  [K in AnalyticsEventName]: z.infer<(typeof analyticsEventSchemas)[K]>;
};
