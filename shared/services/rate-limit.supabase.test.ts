import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseRateLimiter, type RateLimitRpcClient } from "./rate-limit.supabase";
import type { RateLimitRule } from "@/shared/constants/rate-limit";

const RULE: RateLimitRule = { windowMs: 60_000, maxRequests: 5 };

interface RpcRow {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly reset_at_ms: number;
}

function makeClient(
  rows: readonly RpcRow[] | null,
  error: { message: string } | null = null,
): RateLimitRpcClient & { rpc: ReturnType<typeof vi.fn> } {
  return {
    rpc: vi.fn().mockResolvedValue({ data: rows, error }),
  };
}

describe("SupabaseRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00Z"));
  });

  it("calls check_rate_limit RPC with mapped params", async () => {
    const client = makeClient([{ allowed: true, remaining: 4, reset_at_ms: Date.now() + 60_000 }]);
    const limiter = new SupabaseRateLimiter(client);

    await limiter.check({ identifier: "ip-1", rule: RULE });

    expect(client.rpc).toHaveBeenCalledWith("check_rate_limit", {
      p_key: "ip-1",
      p_max_requests: 5,
      p_window_seconds: 60,
    });
  });

  it("maps RPC row to RateLimitResult", async () => {
    const resetAtMs = Date.now() + 30_000;
    const client = makeClient([{ allowed: true, remaining: 3, reset_at_ms: resetAtMs }]);
    const limiter = new SupabaseRateLimiter(client);

    const result = await limiter.check({ identifier: "ip-2", rule: RULE });

    expect(result).toEqual({ allowed: true, remaining: 3, resetAtMs });
  });

  it("returns blocked result when RPC reports allowed=false", async () => {
    const resetAtMs = Date.now() + 60_000;
    const client = makeClient([{ allowed: false, remaining: 0, reset_at_ms: resetAtMs }]);
    const limiter = new SupabaseRateLimiter(client);

    const result = await limiter.check({ identifier: "ip-3", rule: RULE });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAtMs).toBe(resetAtMs);
  });

  it("fails open when RPC returns error (defense-in-depth, not auth)", async () => {
    const client = makeClient(null, { message: "connection refused" });
    const limiter = new SupabaseRateLimiter(client);

    const result = await limiter.check({ identifier: "ip-4", rule: RULE });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RULE.maxRequests);
  });

  it("fails open when RPC returns no rows", async () => {
    const client = makeClient([]);
    const limiter = new SupabaseRateLimiter(client);

    const result = await limiter.check({ identifier: "ip-5", rule: RULE });

    expect(result.allowed).toBe(true);
  });

  it("fails open when RPC row shape is invalid (zod fails)", async () => {
    const malformed = [{ allowed: true }] as unknown as readonly RpcRow[];
    const client = makeClient(malformed);
    const limiter = new SupabaseRateLimiter(client);

    const result = await limiter.check({ identifier: "ip-6", rule: RULE });

    expect(result.allowed).toBe(true);
  });

  it("converts windowMs to whole seconds for the RPC param", async () => {
    const client = makeClient([{ allowed: true, remaining: 5, reset_at_ms: Date.now() + 1_000 }]);
    const limiter = new SupabaseRateLimiter(client);

    await limiter.check({
      identifier: "ip-7",
      rule: { windowMs: 1_500, maxRequests: 1 },
    });

    expect(client.rpc).toHaveBeenCalledWith(
      "check_rate_limit",
      expect.objectContaining({ p_window_seconds: 2 }),
    );
  });
});
