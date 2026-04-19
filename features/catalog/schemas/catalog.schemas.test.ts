import { describe, it, expect } from "vitest";
import { createProductSchema, editProductSchema } from "./catalog.schemas";

describe("createProductSchema", () => {
  const valid = {
    name: "Empanada de carne",
    priceArs: 500,
    isAvailable: true,
  };

  it("accepts a minimal valid product", () => {
    const result = createProductSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts optional description and photoUrl", () => {
    const result = createProductSchema.safeParse({
      ...valid,
      description: "Empanada jugosa",
      photoUrl: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for photoUrl (treated as no URL)", () => {
    const result = createProductSchema.safeParse({ ...valid, photoUrl: "" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createProductSchema.safeParse({ ...valid, name: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 80 chars", () => {
    const result = createProductSchema.safeParse({ ...valid, name: "a".repeat(81) });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative price", () => {
    expect(createProductSchema.safeParse({ ...valid, priceArs: 0 }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...valid, priceArs: -10 }).success).toBe(false);
  });

  it("rejects invalid photo URL", () => {
    const result = createProductSchema.safeParse({ ...valid, photoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 300 chars", () => {
    const result = createProductSchema.safeParse({ ...valid, description: "x".repeat(301) });
    expect(result.success).toBe(false);
  });
});

describe("editProductSchema", () => {
  it("shares the same shape as createProductSchema", () => {
    const result = editProductSchema.safeParse({
      name: "Alfajor",
      priceArs: 200,
      isAvailable: false,
    });
    expect(result.success).toBe(true);
  });
});
