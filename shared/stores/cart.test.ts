import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "@/shared/schemas/product";
import { useCartStore } from "./cart";

const PRODUCT_A: Product = {
  id: "prod-a",
  storeId: "store-1",
  name: "Empanada de carne",
  priceArs: 500,
  isAvailable: true,
};

const PRODUCT_B: Product = {
  id: "prod-b",
  storeId: "store-1",
  name: "Choripán",
  priceArs: 1200,
  isAvailable: true,
};

const PRODUCT_OTHER_STORE: Product = {
  id: "prod-other",
  storeId: "store-2",
  name: "Tacos x3",
  priceArs: 1800,
  isAvailable: true,
};

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ activeStoreId: null, items: [] });
  });

  describe("addItem", () => {
    it("adds a new item from a store and sets activeStoreId", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      const { items, activeStoreId } = useCartStore.getState();

      expect(activeStoreId).toBe("store-1");
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        productId: PRODUCT_A.id,
        productName: PRODUCT_A.name,
        productPriceArs: PRODUCT_A.priceArs,
        quantity: 1,
        storeId: "store-1",
      });
    });

    it("increments quantity when the same product is added again", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      const { items } = useCartStore.getState();

      expect(items).toHaveLength(1);
      expect(items[0]?.quantity).toBe(2);
    });

    it("clears cart and sets new storeId when adding a product from a different store", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().addItem(PRODUCT_OTHER_STORE, "store-2");
      const { items, activeStoreId } = useCartStore.getState();

      expect(activeStoreId).toBe("store-2");
      expect(items).toHaveLength(1);
      expect(items[0]?.productId).toBe(PRODUCT_OTHER_STORE.id);
    });
  });

  describe("removeItem", () => {
    it("removes the item with the given productId", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().addItem(PRODUCT_B, "store-1");
      useCartStore.getState().removeItem(PRODUCT_A.id);
      const { items } = useCartStore.getState();

      expect(items).toHaveLength(1);
      expect(items[0]?.productId).toBe(PRODUCT_B.id);
    });

    it("does nothing when productId not in cart", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().removeItem("non-existent");
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe("clearCart", () => {
    it("empties items and resets activeStoreId", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().clearCart();
      const { items, activeStoreId } = useCartStore.getState();

      expect(items).toHaveLength(0);
      expect(activeStoreId).toBeNull();
    });
  });

  describe("totalItems", () => {
    it("returns sum of all quantities", () => {
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().addItem(PRODUCT_A, "store-1");
      useCartStore.getState().addItem(PRODUCT_B, "store-1");

      expect(useCartStore.getState().totalItems()).toBe(3);
    });

    it("returns 0 for empty cart", () => {
      expect(useCartStore.getState().totalItems()).toBe(0);
    });
  });
});
