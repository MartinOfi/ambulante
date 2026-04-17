import { describe, expect, it } from "vitest";
import { COLORS } from "./tokens";
import { WCAG_THRESHOLDS, contrastRatio, hslToLuminance, parseHsl } from "./contrast";

describe("hslToLuminance", () => {
  it("pure white has luminance 1.0", () => {
    expect(hslToLuminance({ h: 0, s: 0, l: 100 })).toBeCloseTo(1.0, 3);
  });

  it("pure black has luminance 0.0", () => {
    expect(hslToLuminance({ h: 0, s: 0, l: 0 })).toBeCloseTo(0.0, 3);
  });
});

describe("parseHsl", () => {
  it("parses 'H S% L%' token strings", () => {
    expect(parseHsl("222 47% 11%")).toEqual({ h: 222, s: 47, l: 11 });
    expect(parseHsl("0 0% 100%")).toEqual({ h: 0, s: 0, l: 100 });
  });
});

describe("contrastRatio", () => {
  it("black on white is 21:1", () => {
    const r = contrastRatio(parseHsl("0 0% 0%"), parseHsl("0 0% 100%"));
    expect(r).toBeCloseTo(21, 0);
  });

  it("is symmetric (fg/bg order doesn't matter)", () => {
    const fg = parseHsl("222 47% 11%");
    const bg = parseHsl("33 100% 96%");
    expect(contrastRatio(fg, bg)).toBeCloseTo(contrastRatio(bg, fg), 5);
  });
});

describe("WCAG AA compliance — light mode", () => {
  const surface = parseHsl(COLORS.raw.light.surface);
  const surfaceElevated = parseHsl(COLORS.raw.light.surfaceElevated);

  it("foreground on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.foreground), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("foreground on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.foreground), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("muted on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.muted), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("muted on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.muted), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("success on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.success), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("success on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.success), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("destructive on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.destructive), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("brandPrimary on surface passes AA large text / UI (≥3.0)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.light.brandPrimary), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.largeText);
  });
});

describe("WCAG AA compliance — dark mode", () => {
  const surface = parseHsl(COLORS.raw.dark.surface);
  const surfaceElevated = parseHsl(COLORS.raw.dark.surfaceElevated);

  it("foreground on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.foreground), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("foreground on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.foreground), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("muted on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.muted), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("muted on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.muted), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("success on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.success), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("destructive on surface passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.destructive), surface);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });

  it("destructive on surfaceElevated passes AA normal text (≥4.5)", () => {
    const r = contrastRatio(parseHsl(COLORS.raw.dark.destructive), surfaceElevated);
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.normalText);
  });
});

describe("WCAG AA compliance — shared tokens (both modes)", () => {
  it("primaryForeground on brandPrimary passes AA large text (≥3.0)", () => {
    const r = contrastRatio(
      parseHsl(COLORS.raw.light.primaryForeground),
      parseHsl(COLORS.raw.light.brandPrimary),
    );
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.largeText);
  });

  it("brandAccent on dark surface passes AA large text / UI (≥3.0)", () => {
    const r = contrastRatio(
      parseHsl(COLORS.raw.dark.brandAccent),
      parseHsl(COLORS.raw.dark.surface),
    );
    expect(r).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.largeText);
  });
});
