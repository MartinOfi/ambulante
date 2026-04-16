import { describe, expect, it } from "vitest";
import { productSchema } from "./product";

describe("productSchema", () => {
  const validProduct = {
    id: "product-1",
    storeId: "store-1",
    name: "Choripán",
    description: "Chorizo artesanal con chimichurri",
    priceArs: 1500,
    photoUrl: "https://example.com/choripan.jpg",
    isAvailable: true,
  };

  it("accepts a valid product", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("allows optional photoUrl", () => {
    const { photoUrl: _p, ...withoutPhoto } = validProduct;
    const result = productSchema.safeParse(withoutPhoto);
    expect(result.success).toBe(true);
  });

  it("allows optional description", () => {
    const { description: _d, ...withoutDesc } = validProduct;
    const result = productSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({ ...validProduct, priceArs: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = productSchema.safeParse({ ...validProduct, priceArs: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing storeId", () => {
    const { storeId: _s, ...withoutStoreId } = validProduct;
    const result = productSchema.safeParse(withoutStoreId);
    expect(result.success).toBe(false);
  });
});
