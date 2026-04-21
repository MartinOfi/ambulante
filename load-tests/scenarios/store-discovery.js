/**
 * Store discovery scenario.
 * Simulates concurrent clients searching for nearby stores (Q1 hot query from F15.5).
 *
 * PRD §8 KPI targeted: "Tiendas activas concurrentes — medir baseline"
 * This is the most DB-intensive read: PostGIS ST_DWithin with GIST index.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";
import {
  BASE_URL,
  HTTP_TIMEOUT_MS,
  LOAD_STAGES,
  STORE_DISCOVERY_THRESHOLDS,
  randomBuenosAiresCoords,
  randomBetween,
} from "../k6.config.js";

export const options = {
  stages: LOAD_STAGES,
  thresholds: STORE_DISCOVERY_THRESHOLDS,
};

/** Custom metric: track geoquery duration separately from other requests */
const geoqueryDuration = new Trend("geoquery_duration_ms");
const geoqueryErrorRate = new Rate("geoquery_errors");

const REQUEST_PARAMS = {
  timeout: HTTP_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
};

/** Realistic search radii in meters — clients typically search 500m-5km */
const SEARCH_RADII_METERS = [500, 1000, 2000, 5000];

function pickRadius() {
  const index = Math.floor(Math.random() * SEARCH_RADII_METERS.length);
  return SEARCH_RADII_METERS[index];
}

export default function storeDiscovery() {
  const coords = randomBuenosAiresCoords();
  const radiusMeters = pickRadius();

  const queryParams = new URLSearchParams({
    lat: coords.lat.toFixed(6),
    lng: coords.lng.toFixed(6),
    radius: radiusMeters,
  }).toString();

  const response = http.get(`${BASE_URL}/api/stores/nearby?${queryParams}`, REQUEST_PARAMS);

  geoqueryDuration.add(response.timings.duration);

  // Latency belongs in options.thresholds (STORE_DISCOVERY_THRESHOLDS), not here.
  // Mixing a timing assertion into check() would count slow-but-valid responses as errors.
  const isSuccess = check(response, {
    "nearby stores status 200": (res) => res.status === 200,
    "nearby stores returns array": (res) => {
      if (res.status !== 200) return true; // skip body check on error
      try {
        const body = JSON.parse(res.body);
        return Array.isArray(body.data) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  geoqueryErrorRate.add(!isSuccess);

  // Realistic think time: user looks at results for 2-5s before next action
  sleep(randomBetween(2, 5));
}
