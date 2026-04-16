import { describe, expect, it } from "vitest";
import { coordinatesSchema } from "./coordinates";

describe("coordinatesSchema", () => {
  it("accepts valid coordinates", () => {
    const result = coordinatesSchema.safeParse({ lat: -34.603722, lng: -58.381592 });
    expect(result.success).toBe(true);
  });

  it("rejects missing lat", () => {
    const result = coordinatesSchema.safeParse({ lng: -58.381592 });
    expect(result.success).toBe(false);
  });

  it("rejects missing lng", () => {
    const result = coordinatesSchema.safeParse({ lat: -34.603722 });
    expect(result.success).toBe(false);
  });

  it("rejects lat out of range (>90)", () => {
    const result = coordinatesSchema.safeParse({ lat: 91, lng: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects lat out of range (<-90)", () => {
    const result = coordinatesSchema.safeParse({ lat: -91, lng: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects lng out of range (>180)", () => {
    const result = coordinatesSchema.safeParse({ lat: 0, lng: 181 });
    expect(result.success).toBe(false);
  });

  it("rejects lng out of range (<-180)", () => {
    const result = coordinatesSchema.safeParse({ lat: 0, lng: -181 });
    expect(result.success).toBe(false);
  });

  it("rejects string values", () => {
    const result = coordinatesSchema.safeParse({ lat: "not-a-number", lng: 0 });
    expect(result.success).toBe(false);
  });
});
