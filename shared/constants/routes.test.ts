import { describe, expect, it } from "vitest";
import { ROUTES, buildHref } from "./routes";

describe("ROUTES", () => {
  it("exposes the public home route", () => {
    expect(ROUTES.public.home).toBe("/");
  });

  it("exposes the client map route", () => {
    expect(ROUTES.client.map).toBe("/map");
  });

  it("exposes the store dashboard route", () => {
    expect(ROUTES.store.dashboard).toBe("/store/dashboard");
  });

  it("exposes the admin dashboard route", () => {
    expect(ROUTES.admin.dashboard).toBe("/admin/dashboard");
  });
});

describe("buildHref", () => {
  it("returns the template unchanged when there are no params", () => {
    expect(buildHref("/map")).toBe("/map");
  });

  it("interpolates a single param", () => {
    expect(buildHref("/store/:storeId", { storeId: "abc-123" })).toBe(
      "/store/abc-123",
    );
  });

  it("interpolates multiple params", () => {
    expect(
      buildHref("/store/:storeId/order/:orderId", {
        storeId: "s1",
        orderId: "o9",
      }),
    ).toBe("/store/s1/order/o9");
  });

  it("throws if a required param is missing", () => {
    expect(() =>
      buildHref("/store/:storeId/order/:orderId", { storeId: "s1" }),
    ).toThrow();
  });
});
