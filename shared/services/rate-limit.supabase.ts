import { z } from "zod";
import { logger } from "@/shared/utils/logger";
import type { RateLimitCheckInput, RateLimitResult, RateLimitService } from "./rate-limit";

const MS_PER_SECOND = 1_000;

const rpcRowSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number(),
  reset_at_ms: z.number(),
});

export interface RateLimitRpcResponse {
  readonly data: readonly unknown[] | null;
  readonly error: { readonly message: string } | null;
}

export interface RateLimitRpcArgs {
  readonly p_key: string;
  readonly p_max_requests: number;
  readonly p_window_seconds: number;
}

export interface RateLimitRpcClient {
  rpc(fn: "check_rate_limit", args: RateLimitRpcArgs): PromiseLike<RateLimitRpcResponse>;
}

// Rate limiting is defense-in-depth, not authentication. If the RPC fails,
// returning fail-closed would let a transient DB issue take down the entire
// app. Fail-open + log: callers see the request go through, operators see
// the alert. Same trade-off Cloudflare/Stripe make.
function failOpen(rule: RateLimitCheckInput["rule"]): RateLimitResult {
  return {
    allowed: true,
    remaining: rule.maxRequests,
    resetAtMs: Date.now() + rule.windowMs,
  };
}

export class SupabaseRateLimiter implements RateLimitService {
  constructor(private readonly client: RateLimitRpcClient) {}

  async check({ identifier, rule }: RateLimitCheckInput): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(rule.windowMs / MS_PER_SECOND);

    const response = await this.client.rpc("check_rate_limit", {
      p_key: identifier,
      p_max_requests: rule.maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (response.error !== null) {
      logger.error("rate-limit.supabase: RPC error, failing open", {
        identifier,
        error: response.error.message,
      });
      return failOpen(rule);
    }

    const rows = response.data ?? [];
    const first = rows[0];
    const parsed = rpcRowSchema.safeParse(first);

    if (!parsed.success) {
      logger.error("rate-limit.supabase: invalid RPC response, failing open", {
        identifier,
        issues: parsed.error.issues,
      });
      return failOpen(rule);
    }

    return {
      allowed: parsed.data.allowed,
      remaining: parsed.data.remaining,
      resetAtMs: parsed.data.reset_at_ms,
    };
  }
}

export function createSupabaseRateLimitService(client: RateLimitRpcClient): RateLimitService {
  return new SupabaseRateLimiter(client);
}
