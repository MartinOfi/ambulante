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

export const RATE_LIMIT_HEADERS = {
  realIp: "x-real-ip",
  forwardedFor: "x-forwarded-for",
  retryAfter: "Retry-After",
  limit: "X-RateLimit-Limit",
  remaining: "X-RateLimit-Remaining",
  reset: "X-RateLimit-Reset",
} as const;

export const RATE_LIMIT_PATH_PREFIXES = {
  api: "/api/",
  orders: "/api/orders",
} as const;
