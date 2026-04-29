export const REQUEST_ID_HEADER = "x-request-id";

// Threshold for "slow" — queries with mean_exec_time above this trigger a Sentry event.
// Aligned with the dashboard threshold in B12.1 (get_top_slow_queries) so the panel
// and the alert use the same definition of "slow".
export const SLOW_QUERY_THRESHOLD_MS = 100;

// A query is also flagged when its current mean is at least this multiple of the
// 7-day-old baseline — catches regressions even on queries that are individually fast.
export const SLOW_QUERY_BASELINE_FACTOR = 1.5;

// Max rows pulled from pg_stat_statements per check — bound the work and the
// number of Sentry events emitted in a single tick.
export const SLOW_QUERY_MAX_RESULTS = 50;

// Truncate query text before sending to Sentry to avoid leaking large bind values
// or very long generated SQL into a third-party SaaS.
export const QUERY_TEXT_MAX_LENGTH = 500;

// Baseline snapshot is considered "fresh enough" within this window — avoids
// comparing today's mean against a baseline taken a few minutes ago.
export const BASELINE_MIN_AGE_DAYS = 6;
