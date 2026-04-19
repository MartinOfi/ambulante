import { describe, expect, it } from "vitest";
import { storeKindSchema, storeStatusSchema, storeSchema } from "./store";

describe("storeKindSchema", () => {
  it("accepts valid store kinds", () => {
    expect(storeKindSchema.safeParse("food-truck").success).toBe(true);
    expect(storeKindSchema.safeParse("street-cart").success).toBe(true);
    expect(storeKindSchema.safeParse("ice-cream").success).toBe(true);
  });

  it("rejects unknown kind", () => {
    expect(storeKindSchema.safeParse("restaurant").success).toBe(false);
  });
});

describe("storeStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(storeStatusSchema.safeParse("open").success).toBe(true);
    expect(storeStatusSchema.safeParse("closed").success).toBe(true);
    expect(storeStatusSchema.safeParse("stale").success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(storeStatusSchema.safeParse("pending").success).toBe(false);
  });
});

describe("storeSchema", () => {
  const validStore = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "El Chori",
    kind: "food-truck",
    photoUrl: "https://example.com/photo.jpg",
    location: { lat: -34.603722, lng: -58.381592 },
    distanceMeters: 500,
    status: "open",
    priceFromArs: 1500,
    tagline: "Los mejores choripanes",
    ownerId: "00000000-0000-4000-8000-000000000002",
  };

  it("accepts a valid store", () => {
    const result = storeSchema.safeParse(validStore);
    expect(result.success).toBe(true);
  });

  it("rejects store with invalid location", () => {
    const result = storeSchema.safeParse({ ...validStore, location: { lat: 999, lng: 0 } });
    expect(result.success).toBe(false);
  });

  it("rejects store with negative price", () => {
    const result = storeSchema.safeParse({ ...validStore, priceFromArs: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects store with negative distance", () => {
    const result = storeSchema.safeParse({ ...validStore, distanceMeters: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects store with empty name", () => {
    const result = storeSchema.safeParse({ ...validStore, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects store with missing required fields", () => {
    const { id: _id, ...withoutId } = validStore;
    const result = storeSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });
});
