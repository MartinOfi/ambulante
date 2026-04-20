import { describe, expect, it } from "vitest";

import {
  SW_CACHE_MAX_ENTRIES,
  SW_CACHE_NAMES,
  SW_CACHE_TTL_SECONDS,
  SW_ROUTE_MATCHERS,
} from "./sw-cache-strategies";

describe("SW_CACHE_NAMES", () => {
  it("defines unique cache names", () => {
    const names = Object.values(SW_CACHE_NAMES);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes required cache buckets", () => {
    expect(SW_CACHE_NAMES.orderHistory).toBeDefined();
    expect(SW_CACHE_NAMES.images).toBeDefined();
    expect(SW_CACHE_NAMES.liveData).toBeDefined();
  });
});

describe("SW_CACHE_TTL_SECONDS", () => {
  it("images TTL is at least 7 days", () => {
    expect(SW_CACHE_TTL_SECONDS.images).toBeGreaterThanOrEqual(7 * 24 * 60 * 60);
  });

  it("orderHistory TTL is at least 1 day", () => {
    expect(SW_CACHE_TTL_SECONDS.orderHistory).toBeGreaterThanOrEqual(24 * 60 * 60);
  });
});

describe("SW_CACHE_MAX_ENTRIES", () => {
  it("all limits are positive integers", () => {
    for (const value of Object.values(SW_CACHE_MAX_ENTRIES)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe("SW_ROUTE_MATCHERS.geolocations", () => {
  const { geolocations } = SW_ROUTE_MATCHERS;

  it("matches /api/locations", () => {
    expect(geolocations.test("/api/locations")).toBe(true);
  });

  it("matches /api/locations/store-123", () => {
    expect(geolocations.test("/api/locations/store-123")).toBe(true);
  });

  it("does not match /api/orders", () => {
    expect(geolocations.test("/api/orders")).toBe(false);
  });
});

describe("SW_ROUTE_MATCHERS ordering invariant", () => {
  it("geolocations also matches api — ordering in sw.ts runtimeCaching is critical", () => {
    // Both matchers match /api/locations. The NetworkOnly geolocations entry
    // MUST be listed before the NetworkFirst api entry in sw.ts runtimeCaching,
    // otherwise live location data would be cached and served stale.
    expect(SW_ROUTE_MATCHERS.geolocations.test("/api/locations")).toBe(true);
    expect(SW_ROUTE_MATCHERS.api.test("/api/locations")).toBe(true);
  });
});

describe("SW_ROUTE_MATCHERS.api", () => {
  const { api } = SW_ROUTE_MATCHERS;

  it("matches /api/orders", () => {
    expect(api.test("/api/orders")).toBe(true);
  });

  it("matches /api/stores/abc", () => {
    expect(api.test("/api/stores/abc")).toBe(true);
  });

  it("does not match /orders", () => {
    expect(api.test("/orders")).toBe(false);
  });

  it("does not match /map", () => {
    expect(api.test("/map")).toBe(false);
  });
});

describe("SW_ROUTE_MATCHERS.orderHistory", () => {
  const { orderHistory } = SW_ROUTE_MATCHERS;

  it("matches /orders", () => {
    expect(orderHistory.test("/orders")).toBe(true);
  });

  it("matches /orders/abc-123", () => {
    expect(orderHistory.test("/orders/abc-123")).toBe(true);
  });

  it("does not match /store/orders", () => {
    expect(orderHistory.test("/store/orders")).toBe(false);
  });

  it("does not match /map", () => {
    expect(orderHistory.test("/map")).toBe(false);
  });
});

describe("SW_ROUTE_MATCHERS.images", () => {
  const { images } = SW_ROUTE_MATCHERS;

  it("matches .png files", () => {
    expect(images.test("/static/logo.png")).toBe(true);
  });

  it("matches .jpg files", () => {
    expect(images.test("/images/hero.jpg")).toBe(true);
  });

  it("matches .svg files", () => {
    expect(images.test("/icons/marker.svg")).toBe(true);
  });

  it("matches .webp files", () => {
    expect(images.test("/assets/banner.webp")).toBe(true);
  });

  it("matches image URLs with query strings", () => {
    expect(images.test("/photo.jpg?w=400")).toBe(true);
  });

  it("does not match .json files", () => {
    expect(images.test("/data/config.json")).toBe(false);
  });

  it("does not match /api routes", () => {
    expect(images.test("/api/images")).toBe(false);
  });
});
