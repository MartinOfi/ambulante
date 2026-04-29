import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { InMemoryRateLimiter, type RateLimitService } from "./rate-limit";
import { SupabaseRateLimiter } from "./rate-limit.supabase";

// Picks the right limiter at module load time based on env.
// In production (Vercel) both env vars are set → Supabase (shared across isolates).
// In dev/test without Supabase → InMemory (per-isolate, fine for one-process scenarios).
export function createRateLimiterFromEnv(): RateLimitService {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    return new SupabaseRateLimiter(createServiceRoleClient(url, serviceRoleKey));
  }

  return new InMemoryRateLimiter();
}
