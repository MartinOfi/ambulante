import { describe, it, expect, beforeEach, vi } from "vitest";
import { InMemoryRateLimiter } from "./rate-limit";
import type { RateLimitRule } from "@/shared/constants/rate-limit";

const TIGHT_RULE: RateLimitRule = {
  windowMs: 1000,
  maxRequests: 3,
};

describe("InMemoryRateLimiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter();
    vi.useFakeTimers();
  });

  it("allows requests within the limit", async () => {
    const result1 = await limiter.check({ identifier: "ip-1", rule: TIGHT_RULE });
    const result2 = await limiter.check({ identifier: "ip-1", rule: TIGHT_RULE });
    const result3 = await limiter.check({ identifier: "ip-1", rule: TIGHT_RULE });

    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("blocks requests that exceed the limit", async () => {
    await limiter.check({ identifier: "ip-2", rule: TIGHT_RULE });
    await limiter.check({ identifier: "ip-2", rule: TIGHT_RULE });
    await limiter.check({ identifier: "ip-2", rule: TIGHT_RULE });

    const blocked = await limiter.check({ identifier: "ip-2", rule: TIGHT_RULE });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAtMs).toBeGreaterThan(Date.now());
  });

  it("tracks different identifiers independently", async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.check({ identifier: "heavy-user", rule: TIGHT_RULE });
    }

    const resultA = await limiter.check({ identifier: "heavy-user", rule: TIGHT_RULE });
    const resultB = await limiter.check({ identifier: "other-user", rule: TIGHT_RULE });

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it("resets counter after the window expires", async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.check({ identifier: "ip-3", rule: TIGHT_RULE });
    }

    vi.advanceTimersByTime(TIGHT_RULE.windowMs + 1);

    const result = await limiter.check({ identifier: "ip-3", rule: TIGHT_RULE });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("returns a resetAtMs in the future when blocked", async () => {
    const before = Date.now();

    for (let i = 0; i < 3; i++) {
      await limiter.check({ identifier: "ip-4", rule: TIGHT_RULE });
    }

    const blocked = await limiter.check({ identifier: "ip-4", rule: TIGHT_RULE });

    expect(blocked.resetAtMs).toBeGreaterThanOrEqual(before + TIGHT_RULE.windowMs);
  });

  it("returns remaining count decreasing with each request", async () => {
    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(await limiter.check({ identifier: "ip-5", rule: TIGHT_RULE }));
    }

    expect(results[0]?.remaining).toBe(2);
    expect(results[1]?.remaining).toBe(1);
    expect(results[2]?.remaining).toBe(0);
  });
});
