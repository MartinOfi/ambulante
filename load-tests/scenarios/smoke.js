/**
 * Smoke test — 1 VU, 30s.
 * Verifies the stack responds before running any load scenario.
 * Run first. If this fails, no other scenario will pass.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, HTTP_TIMEOUT_MS, SMOKE_STAGES, THRESHOLDS } from "../k6.config.js";

export const options = {
  stages: SMOKE_STAGES,
  thresholds: THRESHOLDS,
};

const REQUEST_PARAMS = {
  timeout: HTTP_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
};

export default function smokeTest() {
  const homeResponse = http.get(BASE_URL, REQUEST_PARAMS);
  check(homeResponse, {
    "home page responds 200": (response) => response.status === 200,
  });

  sleep(1);

  const nearbyParams = "lat=-34.603&lng=-58.381&radius=1000";
  const storesResponse = http.get(`${BASE_URL}/api/stores/nearby?${nearbyParams}`, REQUEST_PARAMS);
  check(storesResponse, {
    "stores/nearby responds 200 or 404": (response) =>
      response.status === 200 || response.status === 404,
    "stores/nearby responds in time": (response) => response.timings.duration < 500,
  });

  sleep(1);
}
