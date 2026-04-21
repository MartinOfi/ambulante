/**
 * Shared k6 configuration for all Ambulante load test scenarios.
 * Thresholds are derived from PRD §8 success metrics.
 */

// ─── Base URL ────────────────────────────────────────────────────────────────

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// ─── Domain timeouts (mirror shared/constants/ values) ───────────────────────

/** PRD §9.2: pedido sin respuesta → EXPIRADO a los 10 min */
export const ORDER_EXPIRATION_MINUTES = 10;

/** PRD §9.2: pedido ACEPTADO sin cierre → auto-cierre a 2h */
export const ORDER_AUTO_CLOSE_HOURS = 2;

/** PRD §7.5: tienda reporta ubicación cada 30-60s */
export const STORE_LOCATION_UPDATE_INTERVAL_MIN_MS = 30_000;
export const STORE_LOCATION_UPDATE_INTERVAL_MAX_MS = 60_000;

/** PRD §7.5: descarte si error > 50m */
export const STORE_LOCATION_MAX_ERROR_METERS = 50;

// ─── HTTP ─────────────────────────────────────────────────────────────────────

export const HTTP_TIMEOUT_MS = 10_000;

// ─── SLO Thresholds ──────────────────────────────────────────────────────────
// Derived from PRD §8 and standard web performance targets.

export const THRESHOLDS = {
  /**
   * p95 < 500ms overall — general SLO for all endpoints.
   * Tighter per-scenario thresholds are set in each script.
   */
  http_req_duration: ["p(95)<500"],

  /** Error rate < 1% overall */
  http_req_failed: ["rate<0.01"],
};

/** Thresholds for the store-discovery scenario (critical Q1 geoquery) */
export const STORE_DISCOVERY_THRESHOLDS = {
  http_req_duration: ["p(95)<300", "p(99)<800"],
  http_req_failed: ["rate<0.005"],
};

/** Thresholds for the order-flow scenario */
export const ORDER_FLOW_THRESHOLDS = {
  http_req_duration: ["p(95)<500"],
  http_req_failed: ["rate<0.01"],
  // Custom metric: order acceptance time < 3min (PRD §8)
  order_acceptance_ms: ["p(95)<180000"],
};

// ─── Stage presets ───────────────────────────────────────────────────────────

/** Quick smoke — 1 VU, 30s. Verify stack responds before any load. */
export const SMOKE_STAGES = [{ duration: "30s", target: 1 }];

/** Standard load: ramp up, steady, ramp down */
export const LOAD_STAGES = [
  { duration: "2m", target: 50 },
  { duration: "3m", target: 50 },
  { duration: "1m", target: 0 },
];

/** Location update: ramp to 100 concurrent stores */
export const LOCATION_STAGES = [
  { duration: "1m", target: 10 },
  { duration: "3m", target: 100 },
  { duration: "1m", target: 0 },
];

/** Spike: instant ramp to 500 VUs to validate resilience (PRD §9.3) */
export const SPIKE_STAGES = [
  { duration: "10s", target: 500 },
  { duration: "1m", target: 500 },
  { duration: "10s", target: 0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a random float in [min, max].
 * Used for generating realistic geo coordinates and jitter.
 */
export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Buenos Aires bounding box for realistic geo scenarios.
 * Stores are concentrated in GBA region (PRD §2 context).
 */
export const GEO_BOUNDS = {
  latMin: -34.705,
  latMax: -34.527,
  lngMin: -58.531,
  lngMax: -58.335,
};

/** Returns random coords within Buenos Aires bounds */
export function randomBuenosAiresCoords() {
  return {
    lat: randomBetween(GEO_BOUNDS.latMin, GEO_BOUNDS.latMax),
    lng: randomBetween(GEO_BOUNDS.lngMin, GEO_BOUNDS.lngMax),
  };
}

/** Pause VU for a random duration between min and max milliseconds */
export function jitteredSleep(minMs, maxMs) {
  const { sleep } = require("k6");
  sleep(randomBetween(minMs, maxMs) / 1000);
}
