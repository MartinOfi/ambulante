/**
 * Location update scenario.
 * Simulates concurrent active stores reporting GPS coordinates every 30-60s.
 *
 * PRD §7.5: "Tienda reporta ubicación cada 30–60s mientras disponibilidad = activa."
 * PRD §7.5: "Descartar lecturas con error > 50m."
 * PRD §8 KPI: "Tiendas activas concurrentes — medir baseline"
 *
 * This scenario validates write throughput at scale and ensures the
 * location update endpoint stays fast even with many concurrent stores.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import {
  BASE_URL,
  HTTP_TIMEOUT_MS,
  LOCATION_STAGES,
  THRESHOLDS,
  STORE_LOCATION_UPDATE_INTERVAL_MIN_MS,
  STORE_LOCATION_UPDATE_INTERVAL_MAX_MS,
  STORE_LOCATION_MAX_ERROR_METERS,
  randomBuenosAiresCoords,
  randomBetween,
} from "../k6.config.js";

export const options = {
  stages: LOCATION_STAGES,
  thresholds: {
    ...THRESHOLDS,
    // Location updates must be faster than store interval — server must write
    // and return before the next update from the same store arrives
    http_req_duration: ["p(95)<200"],
    location_write_errors: ["rate<0.01"],
  },
};

const locationWriteDuration = new Trend("location_write_duration_ms");
const locationWriteErrors = new Rate("location_write_errors");

/** Simulates GPS accuracy: most reads are accurate, some have high error */
function generateGpsAccuracy() {
  // 90% chance of accurate reading (< 50m error), 10% over threshold
  return Math.random() < 0.9
    ? randomBetween(5, STORE_LOCATION_MAX_ERROR_METERS - 1)
    : randomBetween(STORE_LOCATION_MAX_ERROR_METERS, 200);
}

export default function locationUpdate() {
  // Each VU represents one active store
  const storeId = `store-${__VU}`;

  // Simulate store reporting loop: report every 30-60s while active
  // k6 iterations handle the outer loop — each iteration = one update cycle
  const coords = randomBuenosAiresCoords();
  const accuracyMeters = generateGpsAccuracy();

  // PRD §7.5: discard readings with error > 50m — the *server* should reject them.
  // We send all readings (including inaccurate) to test that the server discards
  // correctly and returns the appropriate response.
  const payload = JSON.stringify({
    storeId,
    location: { lat: coords.lat, lng: coords.lng },
    accuracyMeters,
    timestamp: new Date().toISOString(),
  });

  const response = http.patch(`${BASE_URL}/api/stores/${storeId}/location`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: HTTP_TIMEOUT_MS,
  });

  locationWriteDuration.add(response.timings.duration);

  const isHighError = accuracyMeters > STORE_LOCATION_MAX_ERROR_METERS;

  const isOk = check(response, {
    "accurate reading accepted (200)": (res) =>
      isHighError ? true : res.status === 200 || res.status === 204,
    "high-error reading rejected (422)": (res) =>
      !isHighError ? true : res.status === 422 || res.status === 400,
    "update responds quickly (<200ms)": (res) => res.timings.duration < 200,
  });

  locationWriteErrors.add(!isOk);

  // Jitter: sleep until next reporting interval (30-60s minus request time)
  const elapsedMs = response.timings.duration;
  const intervalMs = randomBetween(
    STORE_LOCATION_UPDATE_INTERVAL_MIN_MS,
    STORE_LOCATION_UPDATE_INTERVAL_MAX_MS,
  );
  const remainingMs = Math.max(0, intervalMs - elapsedMs);
  sleep(remainingMs / 1000);
}
