import { describe, it, expect } from "vitest";
import { MOTION } from "@/shared/styles/tokens";
import {
  FM_DURATIONS,
  FM_EASINGS,
  TRANSITIONS,
  FADE_IN_VARIANTS,
  SLIDE_UP_VARIANTS,
  SLIDE_DOWN_VARIANTS,
  TW_TRANSITIONS,
} from "@/shared/styles/motion";

describe("FM_DURATIONS", () => {
  it("converts ms durations to seconds", () => {
    expect(FM_DURATIONS.fast).toBe(MOTION.durations.fast / 1000);
    expect(FM_DURATIONS.base).toBe(MOTION.durations.base / 1000);
    expect(FM_DURATIONS.slow).toBe(MOTION.durations.slow / 1000);
  });

  it("fast < base < slow", () => {
    expect(FM_DURATIONS.fast).toBeLessThan(FM_DURATIONS.base);
    expect(FM_DURATIONS.base).toBeLessThan(FM_DURATIONS.slow);
  });
});

describe("FM_EASINGS", () => {
  it("each easing is a valid cubic-bezier (4 numbers)", () => {
    for (const curve of Object.values(FM_EASINGS)) {
      expect(curve).toHaveLength(4);
      for (const value of curve) {
        expect(typeof value).toBe("number");
      }
    }
  });

  it("control points p1x and p2x are in [0, 1]", () => {
    for (const [p1x, , p2x] of Object.values(FM_EASINGS)) {
      expect(p1x).toBeGreaterThanOrEqual(0);
      expect(p1x).toBeLessThanOrEqual(1);
      expect(p2x).toBeGreaterThanOrEqual(0);
      expect(p2x).toBeLessThanOrEqual(1);
    }
  });
});

describe("TRANSITIONS", () => {
  it("tween presets have duration and ease", () => {
    for (const key of ["fast", "base", "slow"] as const) {
      const preset = TRANSITIONS[key];
      expect(preset).toHaveProperty("duration");
      expect(preset).toHaveProperty("ease");
    }
  });

  it("fast.duration matches FM_DURATIONS.fast", () => {
    expect(TRANSITIONS.fast.duration).toBe(FM_DURATIONS.fast);
  });

  it("spring preset has stiffness and damping", () => {
    expect(TRANSITIONS.spring).toHaveProperty("stiffness");
    expect(TRANSITIONS.spring).toHaveProperty("damping");
  });
});

describe("variant presets", () => {
  const allVariants = [FADE_IN_VARIANTS, SLIDE_UP_VARIANTS, SLIDE_DOWN_VARIANTS];

  it("each variant has initial and animate keys", () => {
    for (const variant of allVariants) {
      expect(variant).toHaveProperty("initial");
      expect(variant).toHaveProperty("animate");
      expect(variant).toHaveProperty("exit");
    }
  });

  it("initial state has opacity: 0", () => {
    for (const variant of allVariants) {
      expect(variant.initial).toHaveProperty("opacity", 0);
    }
  });

  it("animate state has opacity: 1", () => {
    for (const variant of allVariants) {
      const animate = variant.animate as Record<string, unknown>;
      expect(animate).toHaveProperty("opacity", 1);
    }
  });

  it("SLIDE_UP_VARIANTS uses positive y offset in initial", () => {
    const initial = SLIDE_UP_VARIANTS.initial as Record<string, unknown>;
    expect(initial.y).toBeGreaterThan(0);
  });

  it("SLIDE_DOWN_VARIANTS uses negative y offset in initial", () => {
    const initial = SLIDE_DOWN_VARIANTS.initial as Record<string, unknown>;
    expect(initial.y).toBeLessThan(0);
  });
});

describe("TW_TRANSITIONS", () => {
  it("each preset is a non-empty string", () => {
    for (const value of Object.values(TW_TRANSITIONS)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("all presets include 'transition' class", () => {
    for (const value of Object.values(TW_TRANSITIONS)) {
      expect(value).toContain("transition");
    }
  });

  it("all presets include 'ease-out'", () => {
    for (const value of Object.values(TW_TRANSITIONS)) {
      expect(value).toContain("ease-out");
    }
  });
});
