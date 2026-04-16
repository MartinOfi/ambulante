import { describe, it, expect } from "vitest";
import {
  stepFiscalSchema,
  stepZoneSchema,
  stepHoursSchema,
  storeOnboardingSchema,
  STORE_ONBOARDING_DAYS,
} from "./store-onboarding.schemas";

describe("stepFiscalSchema", () => {
  it("accepts valid fiscal data", () => {
    const result = stepFiscalSchema.safeParse({
      businessName: "El Rincón del Sabor",
      kind: "food-truck",
      cuit: "20304050607",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty businessName", () => {
    const result = stepFiscalSchema.safeParse({
      businessName: "",
      kind: "food-truck",
      cuit: "20304050607",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const result = stepFiscalSchema.safeParse({
      businessName: "El Rincón",
      kind: "restaurant",
      cuit: "20304050607",
    });
    expect(result.success).toBe(false);
  });

  it("rejects CUIT with fewer than 11 digits", () => {
    const result = stepFiscalSchema.safeParse({
      businessName: "El Rincón",
      kind: "food-truck",
      cuit: "203040506",
    });
    expect(result.success).toBe(false);
  });

  it("rejects CUIT with letters", () => {
    const result = stepFiscalSchema.safeParse({
      businessName: "El Rincón",
      kind: "food-truck",
      cuit: "2030405060A",
    });
    expect(result.success).toBe(false);
  });
});

describe("stepZoneSchema", () => {
  it("accepts valid zone data", () => {
    const result = stepZoneSchema.safeParse({
      neighborhood: "Palermo",
      coverageNotes: "Operamos en el parque los fines de semana",
    });
    expect(result.success).toBe(true);
  });

  it("accepts zone without coverageNotes", () => {
    const result = stepZoneSchema.safeParse({ neighborhood: "Villa Crespo" });
    expect(result.success).toBe(true);
  });

  it("rejects empty neighborhood", () => {
    const result = stepZoneSchema.safeParse({ neighborhood: "" });
    expect(result.success).toBe(false);
  });
});

describe("stepHoursSchema", () => {
  it("accepts valid hours", () => {
    const result = stepHoursSchema.safeParse({
      days: ["lunes", "martes"],
      openTime: "09:00",
      closeTime: "18:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty days array", () => {
    const result = stepHoursSchema.safeParse({
      days: [],
      openTime: "09:00",
      closeTime: "18:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = stepHoursSchema.safeParse({
      days: ["lunes"],
      openTime: "9:00",
      closeTime: "18:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid day name", () => {
    const result = stepHoursSchema.safeParse({
      days: ["monday"],
      openTime: "09:00",
      closeTime: "18:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing openTime", () => {
    const result = stepHoursSchema.safeParse({
      days: ["lunes"],
      closeTime: "18:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("storeOnboardingSchema", () => {
  it("accepts fully valid onboarding data", () => {
    const result = storeOnboardingSchema.safeParse({
      businessName: "El Rincón del Sabor",
      kind: "street-cart",
      cuit: "20304050607",
      neighborhood: "San Telmo",
      coverageNotes: "Plaza Dorrego los domingos",
      days: ["sabado", "domingo"],
      openTime: "10:00",
      closeTime: "20:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects if any required field is missing", () => {
    const result = storeOnboardingSchema.safeParse({
      businessName: "El Rincón",
      kind: "food-truck",
      cuit: "20304050607",
      neighborhood: "Palermo",
      days: ["lunes"],
      // missing openTime and closeTime
    });
    expect(result.success).toBe(false);
  });
});

describe("STORE_ONBOARDING_DAYS", () => {
  it("contains all 7 days in Spanish", () => {
    expect(STORE_ONBOARDING_DAYS).toHaveLength(7);
    expect(STORE_ONBOARDING_DAYS).toContain("lunes");
    expect(STORE_ONBOARDING_DAYS).toContain("domingo");
  });
});
