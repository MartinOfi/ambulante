import { describe, expect, it } from "vitest";
import {
  COLORS,
  MOTION,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
} from "./tokens";

const CSS_VAR_REF_PATTERN = /^hsl\(var\(--[\w-]+\)\)$/;
const HSL_RAW_PATTERN = /^\d{1,3} \d{1,3}% \d{1,3}%$/;

describe("COLORS", () => {
  describe("cssVarRefs", () => {
    it("all refs follow the hsl(var(--token)) pattern", () => {
      const refs = Object.values(COLORS.cssVarRefs);
      for (const ref of refs) {
        if (typeof ref === "string") {
          expect(ref, `"${ref}" must match CSS var ref pattern`).toMatch(
            CSS_VAR_REF_PATTERN
          );
        } else {
          for (const nested of Object.values(ref)) {
            expect(
              nested,
              `"${nested}" must match CSS var ref pattern`
            ).toMatch(CSS_VAR_REF_PATTERN);
          }
        }
      }
    });
  });

  describe("light and dark raw values", () => {
    const modes = ["light", "dark"] as const;

    it.each(modes)("%s mode values are valid HSL strings", (mode) => {
      const palette = COLORS.raw[mode];
      for (const [key, value] of Object.entries(palette)) {
        expect(value, `${mode}.${key} must be a valid HSL string`).toMatch(
          HSL_RAW_PATTERN
        );
      }
    });
  });
});

describe("RADIUS", () => {
  it("values are non-empty pixel or rem strings", () => {
    for (const [key, value] of Object.entries(RADIUS)) {
      expect(typeof value, `RADIUS.${key} must be a string`).toBe("string");
      expect(value.length, `RADIUS.${key} must be non-empty`).toBeGreaterThan(
        0
      );
    }
  });
});

describe("SHADOWS", () => {
  it("all shadow values are non-empty strings", () => {
    for (const [key, value] of Object.entries(SHADOWS)) {
      expect(typeof value, `SHADOWS.${key} must be a string`).toBe("string");
      expect(
        value.length,
        `SHADOWS.${key} must be non-empty`
      ).toBeGreaterThan(0);
    }
  });
});

describe("MOTION", () => {
  it("durations are numeric ms values", () => {
    for (const [key, value] of Object.entries(MOTION.durations)) {
      expect(typeof value, `MOTION.durations.${key} must be a number`).toBe(
        "number"
      );
      expect(value, `MOTION.durations.${key} must be > 0`).toBeGreaterThan(0);
    }
  });

  it("keyframes are objects with at least one step", () => {
    for (const [name, keyframe] of Object.entries(MOTION.keyframes)) {
      expect(
        Object.keys(keyframe).length,
        `MOTION.keyframes.${name} must have at least one step`
      ).toBeGreaterThan(0);
    }
  });

  it("animations reference existing keyframe names", () => {
    const keyframeNames = new Set(Object.keys(MOTION.keyframes));
    for (const [name, animation] of Object.entries(MOTION.animations)) {
      expect(
        keyframeNames.has(animation.keyframe),
        `MOTION.animations.${name} references unknown keyframe "${animation.keyframe}"`
      ).toBe(true);
    }
  });
});

describe("TYPOGRAPHY", () => {
  it("font families are non-empty strings", () => {
    for (const [key, value] of Object.entries(TYPOGRAPHY.fontFamilies)) {
      expect(
        typeof value,
        `TYPOGRAPHY.fontFamilies.${key} must be a string`
      ).toBe("string");
      expect(
        value.length,
        `TYPOGRAPHY.fontFamilies.${key} must be non-empty`
      ).toBeGreaterThan(0);
    }
  });
});
