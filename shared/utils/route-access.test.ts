import { describe, it, expect } from "vitest";
import { getRequiredRole } from "./route-access";

describe("getRequiredRole", () => {
  it("returns client for /map", () => {
    expect(getRequiredRole("/map")).toBe("client");
  });

  it("returns client for /map sub-paths", () => {
    expect(getRequiredRole("/map/stores/abc")).toBe("client");
  });

  it("returns store for /store/dashboard", () => {
    expect(getRequiredRole("/store/dashboard")).toBe("store");
  });

  it("returns store for /store/order/:id", () => {
    expect(getRequiredRole("/store/order/abc-123")).toBe("store");
  });

  it("returns store for /store exact match", () => {
    expect(getRequiredRole("/store")).toBe("store");
  });

  it("returns admin for /admin exact match", () => {
    expect(getRequiredRole("/admin")).toBe("admin");
  });

  it("returns admin for /admin/dashboard", () => {
    expect(getRequiredRole("/admin/dashboard")).toBe("admin");
  });

  it("returns null for /", () => {
    expect(getRequiredRole("/")).toBeNull();
  });

  it("returns null for unknown public paths", () => {
    expect(getRequiredRole("/login")).toBeNull();
  });

  it("returns null for /api paths", () => {
    expect(getRequiredRole("/api/health")).toBeNull();
  });
});
