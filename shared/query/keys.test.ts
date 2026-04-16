import { describe, expect, it } from "vitest";

import { queryKeys } from "./keys";

describe("queryKeys", () => {
  describe("stores", () => {
    it("stores.all returns stable root key", () => {
      expect(queryKeys.stores.all()).toEqual(["stores"]);
    });

    it("stores.nearby returns key with coords and radius", () => {
      const coords = { lat: -34.6, lng: -58.4 };
      const radius = 2000;
      const key = queryKeys.stores.nearby(coords, radius);
      expect(key).toEqual(["stores", "nearby", coords, radius]);
    });

    it("stores.nearby with different coords returns different key", () => {
      const coordsA = { lat: -34.6, lng: -58.4 };
      const coordsB = { lat: -34.7, lng: -58.5 };
      expect(queryKeys.stores.nearby(coordsA, 1000)).not.toEqual(
        queryKeys.stores.nearby(coordsB, 1000),
      );
    });

    it("stores.byId returns key with id", () => {
      expect(queryKeys.stores.byId("store-1")).toEqual([
        "stores",
        "by-id",
        "store-1",
      ]);
    });

    it("stores.byId is nested under stores.all prefix", () => {
      const [root] = queryKeys.stores.all();
      const [byIdRoot] = queryKeys.stores.byId("store-1");
      expect(byIdRoot).toBe(root);
    });
  });

  describe("orders", () => {
    it("orders.all returns stable root key", () => {
      expect(queryKeys.orders.all()).toEqual(["orders"]);
    });

    it("orders.byUser returns key with userId", () => {
      expect(queryKeys.orders.byUser("user-42")).toEqual([
        "orders",
        "by-user",
        "user-42",
      ]);
    });

    it("orders.byId returns key with id", () => {
      expect(queryKeys.orders.byId("order-99")).toEqual([
        "orders",
        "by-id",
        "order-99",
      ]);
    });
  });
});
