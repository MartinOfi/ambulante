import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/shared/config/env";
import {
  BASELINE_MIN_AGE_DAYS,
  QUERY_TEXT_MAX_LENGTH,
  SLOW_QUERY_BASELINE_FACTOR,
  SLOW_QUERY_MAX_RESULTS,
  SLOW_QUERY_THRESHOLD_MS,
} from "@/shared/constants/observability";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { getOrCreateRequestLogger } from "@/shared/utils/server-logger";
import { reportSlowQuery, type SlowQueryAlertPayload } from "@/shared/utils/sentry";

const breachKindSchema = z.enum(["absolute", "regression", "absolute_and_regression"]);

// Postgres bigint is JSON-serialized as a string by PostgREST when it overflows
// JS-safe integer range — accept both shapes and normalize to string downstream.
const queryIdSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

const slowQueryRowSchema = z.object({
  queryid: queryIdSchema,
  mean_exec_time_ms: z.number(),
  calls: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  total_exec_time_ms: z.number(),
  query_text: z.string(),
  baseline_mean_ms: z.number().nullable(),
  breach_kind: breachKindSchema,
});

type SlowQueryRow = z.infer<typeof slowQueryRowSchema>;

// Truncate to keep query text bounded in Sentry's `extra` payload — long
// strings get clipped by Sentry anyway and can leak bind values.
function truncateQueryText(text: string): string {
  if (text.length <= QUERY_TEXT_MAX_LENGTH) return text;
  return `${text.slice(0, QUERY_TEXT_MAX_LENGTH - 1)}…`;
}

function rowToPayload(row: SlowQueryRow, requestId: string): SlowQueryAlertPayload {
  return {
    queryid: row.queryid,
    meanExecTimeMs: row.mean_exec_time_ms,
    calls: row.calls,
    totalExecTimeMs: row.total_exec_time_ms,
    queryText: truncateQueryText(row.query_text),
    baselineMeanMs: row.baseline_mean_ms,
    breachKind: row.breach_kind,
    requestId,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { logger, requestId } = getOrCreateRequestLogger(request);

  const cronSecret = env.CRON_SECRET;
  if (cronSecret === undefined) {
    logger.error("check-slow-queries: CRON_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined || serviceRoleKey === undefined) {
    logger.error("check-slow-queries: Supabase service role credentials not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const client = createServiceRoleClient(supabaseUrl, serviceRoleKey);
  const { data, error: rpcError } = await client.rpc("get_slow_queries_for_alerts", {
    p_threshold_ms: SLOW_QUERY_THRESHOLD_MS,
    p_limit: SLOW_QUERY_MAX_RESULTS,
    p_baseline_factor: SLOW_QUERY_BASELINE_FACTOR,
    p_baseline_min_age_days: BASELINE_MIN_AGE_DAYS,
  });

  if (rpcError !== null) {
    logger.error("check-slow-queries: RPC failed", { error: rpcError });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const parsed = slowQueryRowSchema.array().safeParse(data ?? []);
  if (!parsed.success) {
    logger.error("check-slow-queries: unexpected RPC response shape", { error: parsed.error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const rows = parsed.data;
  let alerted = 0;
  for (const row of rows) {
    const payload = rowToPayload(row, requestId);
    reportSlowQuery(payload);
    logger.warn("slow-query-detected", {
      queryid: payload.queryid,
      meanExecTimeMs: payload.meanExecTimeMs,
      breachKind: payload.breachKind,
    });
    alerted += 1;
  }

  return NextResponse.json({ count: rows.length, alerted, requestId });
}
