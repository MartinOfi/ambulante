import { z } from "zod";

export const slowQuerySchema = z.object({
  calls: z.number().int().nonnegative(),
  totalExecTimeMs: z.number().nonnegative(),
  meanExecTimeMs: z.number().nonnegative(),
  queryText: z.string().min(1),
});

export const slowQueryArraySchema = z.array(slowQuerySchema);

export type SlowQuery = z.infer<typeof slowQuerySchema>;
