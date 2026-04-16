/**
 * Design tokens — single source of truth for the Ambulante design system.
 *
 * Three-layer architecture:
 *   1. COLORS.raw — raw HSL strings (readable at runtime, no CSS var lookup)
 *   2. COLORS.cssVarRefs — hsl(var(--token)) strings consumed by tailwind.config.ts
 *   3. globals.css — CSS custom properties that switch value between :root and .dark
 *
 * tailwind.config.ts imports from this file so there is no duplication between
 * the design system and the Tailwind config.
 */

// ─── Color tokens ────────────────────────────────────────────────────────────

/** Raw HSL values per theme mode. Used when a component needs to read a token
 *  value at runtime (e.g. canvas drawing, SVG fills, opacity calculations).
 *  Format: "H S% L%" — no hsl() wrapper, matching the CSS var declarations. */
export const COLORS = {
  raw: {
    light: {
      brandPrimary: "21 90% 48%",
      brandPrimaryHover: "21 90% 40%",
      brandAccent: "221 83% 53%",
      surface: "33 100% 96%",
      surfaceElevated: "0 0% 100%",
      foreground: "222 47% 11%",
      muted: "215 16% 47%",
      ink: "222 47% 11%",
      success: "142 71% 45%",
      border: "24 75% 94%",
      destructive: "0 72% 51%",
    },
    dark: {
      brandPrimary: "21 90% 48%",
      brandPrimaryHover: "21 90% 40%",
      brandAccent: "221 83% 53%",
      surface: "222 47% 6%",
      surfaceElevated: "222 35% 12%",
      foreground: "33 100% 96%",
      muted: "215 16% 65%",
      ink: "222 60% 3%",
      success: "142 71% 45%",
      border: "222 25% 18%",
      destructive: "0 72% 51%",
    },
  },

  /**
   * CSS var references consumed by tailwind.config.ts.
   * These strings resolve at render time via the CSS custom properties in
   * globals.css, automatically switching between light/dark values.
   */
  cssVarRefs: {
    brand: {
      DEFAULT: "hsl(var(--brand-primary))",
      hover: "hsl(var(--brand-primary-hover))",
      accent: "hsl(var(--brand-accent))",
    },
    surface: {
      DEFAULT: "hsl(var(--surface))",
      elevated: "hsl(var(--surface-elevated))",
    },
    foreground: "hsl(var(--foreground))",
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted))",
    },
    success: "hsl(var(--success))",
    border: "hsl(var(--border))",
    destructive: "hsl(var(--destructive))",
    ink: "hsl(var(--ink))",
    // shadcn-style aliases — mapped onto Ambulante tokens
    background: "hsl(var(--surface))",
    input: "hsl(var(--border))",
    ring: "hsl(var(--brand-primary))",
    primary: {
      DEFAULT: "hsl(var(--brand-primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--border))",
      foreground: "hsl(var(--foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--surface-elevated))",
      foreground: "hsl(var(--foreground))",
    },
  },
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

/** Custom border radius values that extend Tailwind's default scale. */
export const RADIUS = {
  card: "20px",
  sheet: "28px",
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

/** Box shadow definitions. Named after the UI element they were designed for
 *  so consumers understand the intended use without magic rgba strings. */
export const SHADOWS = {
  /** Orange glow for map pins — brand-colored drop shadow. */
  pin: "0 4px 12px rgba(234, 88, 12, 0.35)",
  /** Bottom sheet lift — soft dark shadow on the leading edge. */
  sheet: "0 -8px 32px rgba(15, 23, 42, 0.12)",
  /** Floating Action Button — stronger orange glow than pin. */
  fab: "0 8px 24px rgba(234, 88, 12, 0.45)",
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

/** Duration values in milliseconds. Kept as numbers so consumers can do
 *  arithmetic (e.g. stagger = BASE_DURATION + index * STAGGER_STEP). */
export const MOTION = {
  durations: {
    fast: 200,
    base: 300,
    slow: 500,
    radar: 2800,
    pinPulse: 2000,
    marquee: 40000,
    liveBlink: 1600,
    pinFade: 3200,
    fadeSlideIn: 800,
  },

  easings: {
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    linear: "linear",
  },

  /**
   * Keyframe definitions mirroring what globals.css declares.
   * Kept here so Tailwind can register them via `theme.extend.keyframes`
   * and components can reference them with `animate-*` classes.
   */
  keyframes: {
    "pulse-pin": {
      "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
      "50%": { transform: "scale(1.6)", opacity: "0" },
    },
    "fade-up": {
      from: { opacity: "0", transform: "translateY(8px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
  },

  /** Animation shorthand strings for `theme.extend.animation`. */
  animations: {
    "pulse-pin": {
      keyframe: "pulse-pin",
      value: "pulse-pin 2s ease-out infinite",
    },
    "fade-up": {
      keyframe: "fade-up",
      value: "fade-up 200ms ease-out",
    },
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  fontFamilies: {
    display: "var(--font-display)",
    sans: "var(--font-sans)",
  },
} as const;
