import { describe, expect, it } from "vitest";

import { formatDistance, formatPrice } from "./format";

describe("formatDistance", () => {
  it("rounds meters below 1km to the nearest integer with 'm' suffix", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(12.4)).toBe("12 m");
    expect(formatDistance(12.6)).toBe("13 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("formats values of 1km or more with one decimal and 'km' suffix", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1234)).toBe("1.2 km");
    expect(formatDistance(5500)).toBe("5.5 km");
  });
});

describe("formatPrice", () => {
  it("defaults to ARS and produces an es-AR currency string", () => {
    const formatted = formatPrice(1500);
    expect(formatted).toMatch(/\$/);
    expect(formatted).toMatch(/1[.,]500/);
  });

  it("respects an explicit currency code", () => {
    const formatted = formatPrice(1500, "USD");
    expect(formatted).toMatch(/1[.,]500/);
  });
});
