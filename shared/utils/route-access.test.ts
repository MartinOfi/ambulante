import { describe, it, expect } from "vitest";
import { getRequiredRole } from "./route-access";
import { USER_ROLES } from "@/shared/constants/user";

describe("getRequiredRole", () => {
  it("returns client for /map", () => {
    expect(getRequiredRole("/map")).toBe(USER_ROLES.client);
  });

  it("returns client for /map sub-paths", () => {
    expect(getRequiredRole("/map/stores/abc")).toBe(USER_ROLES.client);
  });

  it("returns store for /store/dashboard", () => {
    expect(getRequiredRole("/store/dashboard")).toBe("tienda");
  });

  it("returns store for /store/order/:id", () => {
    expect(getRequiredRole("/store/order/abc-123")).toBe("tienda");
  });

  it("returns store for /store exact match", () => {
    expect(getRequiredRole("/store")).toBe("tienda");
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

  it("returns client for /orders", () => {
    expect(getRequiredRole("/orders")).toBe(USER_ROLES.client);
  });

  it("returns client for /orders sub-paths", () => {
    expect(getRequiredRole("/orders/abc-123")).toBe(USER_ROLES.client);
  });

  it("returns client for /profile", () => {
    expect(getRequiredRole("/profile")).toBe(USER_ROLES.client);
  });

  it("returns client for /profile sub-paths", () => {
    expect(getRequiredRole("/profile/settings")).toBe(USER_ROLES.client);
  });
});
