import { describe, it, expect } from "vitest";

import {
  CACHE_REVALIDATION_SECONDS,
  CACHE_TAGS,
  HTTP_CACHE_CONTROL,
} from "@/shared/config/cache-config";

describe("CACHE_REVALIDATION_SECONDS", () => {
  it("has a FLAGS entry that is a positive number", () => {
    expect(typeof CACHE_REVALIDATION_SECONDS.FLAGS).toBe("number");
    expect(CACHE_REVALIDATION_SECONDS.FLAGS).toBeGreaterThan(0);
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(CACHE_REVALIDATION_SECONDS)).toBe(true);
  });
});

describe("CACHE_TAGS", () => {
  it("has a FLAGS entry that is a string", () => {
    expect(typeof CACHE_TAGS.FLAGS).toBe("string");
    expect(CACHE_TAGS.FLAGS.length).toBeGreaterThan(0);
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(CACHE_TAGS)).toBe(true);
  });
});

describe("HTTP_CACHE_CONTROL", () => {
  it("has IMMUTABLE_ASSET with max-age and immutable directives", () => {
    expect(HTTP_CACHE_CONTROL.IMMUTABLE_ASSET).toContain("immutable");
    expect(HTTP_CACHE_CONTROL.IMMUTABLE_ASSET).toContain("max-age=");
  });

  it("has PUBLIC_PAGE with s-maxage and stale-while-revalidate", () => {
    expect(HTTP_CACHE_CONTROL.PUBLIC_PAGE).toContain("s-maxage=");
    expect(HTTP_CACHE_CONTROL.PUBLIC_PAGE).toContain("stale-while-revalidate=");
    expect(HTTP_CACHE_CONTROL.PUBLIC_PAGE).toContain("public");
  });

  it("has PRIVATE_NO_CACHE that prevents caching", () => {
    expect(HTTP_CACHE_CONTROL.PRIVATE_NO_CACHE).toContain("private");
    expect(HTTP_CACHE_CONTROL.PRIVATE_NO_CACHE).toContain("no-store");
  });

  it("has API_NO_STORE set to no-store", () => {
    expect(HTTP_CACHE_CONTROL.API_NO_STORE).toBe("no-store");
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(HTTP_CACHE_CONTROL)).toBe(true);
  });
});
