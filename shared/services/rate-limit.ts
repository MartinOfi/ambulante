import type { RateLimitRule } from "@/shared/constants/rate-limit";

export interface RateLimitCheckInput {
  readonly identifier: string;
  readonly rule: RateLimitRule;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAtMs: number;
}

export interface RateLimitService {
  check(input: RateLimitCheckInput): Promise<RateLimitResult>;
}

interface WindowEntry {
  readonly count: number;
  readonly windowStart: number;
}

export class InMemoryRateLimiter implements RateLimitService {
  private readonly store = new Map<string, WindowEntry>();

  async check({ identifier, rule }: RateLimitCheckInput): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.store.get(identifier);
    const isExpired = !existing || now - existing.windowStart >= rule.windowMs;

    const entry: WindowEntry = isExpired
      ? { count: 1, windowStart: now }
      : { count: existing.count + 1, windowStart: existing.windowStart };

    this.store.set(identifier, entry);

    const resetAtMs = entry.windowStart + rule.windowMs;
    const allowed = entry.count <= rule.maxRequests;
    const remaining = Math.max(0, rule.maxRequests - entry.count);

    return { allowed, remaining, resetAtMs };
  }
}

export function createRateLimitService(): RateLimitService {
  return new InMemoryRateLimiter();
}
