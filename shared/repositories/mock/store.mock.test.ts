import { describe, it, expect, beforeEach } from "vitest";
import { MockStoreRepository } from "./store.mock";
import type { Store } from "@/shared/schemas/store";

const makeStore = (overrides: Partial<Store> = {}): Store => ({
  id: "test-store",
  name: "Test Store",
  kind: "food-truck",
  photoUrl: "https://example.com/photo.jpg",
  location: { lat: -34.6, lng: -58.38 },
  distanceMeters: 300,
  status: "open",
  priceFromArs: 800,
  tagline: "Test tagline",
  ...overrides,
});

describe("MockStoreRepository", () => {
  let repository: MockStoreRepository;

  beforeEach(() => {
    repository = new MockStoreRepository();
  });

  describe("findAll", () => {
    it("returns all seeded stores", async () => {
      const stores = await repository.findAll();
      expect(stores.length).toBeGreaterThan(0);
    });

    it("filters by status when provided", async () => {
      const openStores = await repository.findAll({ status: "open" });
      expect(openStores.every((store) => store.status === "open")).toBe(true);
    });
  });

  describe("findById", () => {
    it("returns existing store by id", async () => {
      const allStores = await repository.findAll();
      const firstStore = allStores[0];
      const found = await repository.findById(firstStore.id);
      expect(found).toEqual(firstStore);
    });

    it("returns null for unknown id", async () => {
      const result = await repository.findById("does-not-exist");
      expect(result).toBeNull();
    });
  });

  describe("findNearby", () => {
    it("returns stores within radius", async () => {
      const nearby = await repository.findNearby({
        coords: { lat: -34.6, lng: -58.38 },
        radiusMeters: 500,
      });
      expect(nearby.every((store) => store.distanceMeters <= 500)).toBe(true);
    });

    it("returns stores sorted by distance ascending", async () => {
      const nearby = await repository.findNearby({
        coords: { lat: -34.6, lng: -58.38 },
        radiusMeters: 5000,
      });
      const distances = nearby.map((store) => store.distanceMeters);
      const sorted = [...distances].sort((a, b) => a - b);
      expect(distances).toEqual(sorted);
    });

    it("returns empty array when no stores within radius", async () => {
      const nearby = await repository.findNearby({
        coords: { lat: -34.6, lng: -58.38 },
        radiusMeters: 0,
      });
      expect(nearby).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("persists a new store and returns it", async () => {
      const input = makeStore({ id: "new-store", name: "New Store" });
      const created = await repository.create(input);
      expect(created.id).toBe("new-store");

      const found = await repository.findById("new-store");
      expect(found).toEqual(created);
    });

    it("does not mutate the original data collection", async () => {
      const before = await repository.findAll();
      const beforeCount = before.length;
      await repository.create(makeStore({ id: "extra" }));
      const after = await repository.findAll();
      expect(after.length).toBe(beforeCount + 1);
      expect(before.length).toBe(beforeCount);
    });
  });

  describe("update", () => {
    it("returns updated store with new values", async () => {
      const allStores = await repository.findAll();
      const storeId = allStores[0].id;

      const updated = await repository.update(storeId, { status: "closed" });
      expect(updated.status).toBe("closed");
      expect(updated.id).toBe(storeId);
    });

    it("throws when store does not exist", async () => {
      await expect(repository.update("ghost-id", { status: "closed" })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("removes the store from the collection", async () => {
      const newStore = await repository.create(makeStore({ id: "to-delete" }));
      await repository.delete(newStore.id);
      const found = await repository.findById(newStore.id);
      expect(found).toBeNull();
    });

    it("throws when store does not exist", async () => {
      await expect(repository.delete("ghost-id")).rejects.toThrow();
    });
  });
});
