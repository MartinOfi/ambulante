export interface RateLimitRule {
  readonly windowMs: number;
  readonly maxRequests: number;
}

export const RATE_LIMIT_RULES = {
  orders: {
    windowMs: 60_000,
    maxRequests: 5,
  },
  api: {
    windowMs: 60_000,
    maxRequests: 60,
  },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitRouteGroup = keyof typeof RATE_LIMIT_RULES;
