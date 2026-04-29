import * as Sentry from "@sentry/nextjs";
import { createHash, timingSafeEqual } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { logger } from "@/shared/utils/logger";

const SUPABASE_LOG_LEVEL = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
} as const;

type SupabaseLogLevel = (typeof SUPABASE_LOG_LEVEL)[keyof typeof SUPABASE_LOG_LEVEL];

const WARN_AND_ABOVE: ReadonlySet<SupabaseLogLevel> = new Set([
  SUPABASE_LOG_LEVEL.WARNING,
  SUPABASE_LOG_LEVEL.ERROR,
]);

const supabaseLogEventSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(),
  event_message: z.string(),
  level: z.enum([
    SUPABASE_LOG_LEVEL.DEBUG,
    SUPABASE_LOG_LEVEL.INFO,
    SUPABASE_LOG_LEVEL.WARNING,
    SUPABASE_LOG_LEVEL.ERROR,
  ]),
  metadata: z.record(z.unknown()).optional(),
});

type SupabaseLogEvent = z.infer<typeof supabaseLogEventSchema>;

const supabaseWebhookBodySchema = z.union([
  supabaseLogEventSchema,
  z.array(supabaseLogEventSchema),
]);

function dispatchToSentry(event: SupabaseLogEvent): void {
  const extra = { ...event.metadata, timestamp: event.timestamp };

  if (event.level === SUPABASE_LOG_LEVEL.ERROR) {
    Sentry.captureException(new Error(event.event_message), { extra });
  } else {
    Sentry.captureMessage(event.event_message, { level: "warning", extra });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = env.SUPABASE_WEBHOOK_SECRET;
  if (secret === undefined) {
    logger.error("supabase-logs webhook: SUPABASE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const incoming = request.headers.get("Authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(digest(incoming), digest(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = supabaseWebhookBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("supabase-logs webhook: invalid payload", { issues: parsed.error.issues });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const events = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  let dispatched = 0;

  for (const event of events) {
    if (WARN_AND_ABOVE.has(event.level)) {
      try {
        dispatchToSentry(event);
        dispatched += 1;
      } catch (err) {
        logger.error("supabase-logs webhook: failed to dispatch to Sentry", { err, event });
      }
    }
  }

  return NextResponse.json({ received: events.length, dispatched });
}
