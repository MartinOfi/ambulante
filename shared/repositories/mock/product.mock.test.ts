import { describe, it, expect, beforeEach } from "vitest";
import { MockProductRepository } from "./product.mock";
import type { Product } from "@/shared/schemas/product";

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  storeId: "store-1",
  name: "Empanada",
  priceArs: 500,
  isAvailable: true,
  ...overrides,
});

describe("MockProductRepository", () => {
  let repository: MockProductRepository;

  beforeEach(() => {
    repository = new MockProductRepository();
  });

  describe("findAll", () => {
    it("returns empty array when no products", async () => {
      const products = await repository.findAll();
      expect(products).toHaveLength(0);
    });

    it("filters by storeId", async () => {
      await repository.create(makeProduct({ id: "p-A", storeId: "store-A" }));
      await repository.create(makeProduct({ id: "p-B", storeId: "store-B" }));

      const storeAProducts = await repository.findAll({ storeId: "store-A" });
      expect(storeAProducts).toHaveLength(1);
      expect(storeAProducts[0].storeId).toBe("store-A");
    });

    it("filters by isAvailable", async () => {
      await repository.create(makeProduct({ id: "p-avail", isAvailable: true }));
      await repository.create(makeProduct({ id: "p-unavail", isAvailable: false }));

      const available = await repository.findAll({ isAvailable: true });
      expect(available).toHaveLength(1);
      expect(available[0].isAvailable).toBe(true);
    });
  });

  describe("findById", () => {
    it("returns null for unknown id", async () => {
      const result = await repository.findById("ghost");
      expect(result).toBeNull();
    });

    it("returns product after creation", async () => {
      const created = await repository.create(makeProduct());
      const found = await repository.findById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe("create", () => {
    it("persists and returns the product", async () => {
      const created = await repository.create(makeProduct({ id: "new-prod", name: "Chorizo" }));
      expect(created.id).toBe("new-prod");
      expect(created.name).toBe("Chorizo");
    });
  });

  describe("update", () => {
    it("updates product fields immutably", async () => {
      const created = await repository.create(makeProduct());
      const originalName = created.name;

      const updated = await repository.update(created.id, { name: "Updated Empanada" });
      expect(updated.name).toBe("Updated Empanada");
      expect(created.name).toBe(originalName);
    });

    it("throws when product does not exist", async () => {
      await expect(repository.update("ghost", { name: "x" })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("removes the product", async () => {
      const created = await repository.create(makeProduct());
      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("throws when product does not exist", async () => {
      await expect(repository.delete("ghost")).rejects.toThrow();
    });
  });
});
