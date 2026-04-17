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
  /** Brutalist card offset — solid foreground shadow at rest. */
  "card-brutal": "4px 4px 0 0 hsl(var(--foreground))",
  /** Brutalist card offset — reduced on hover to simulate press. */
  "card-brutal-hover": "2px 2px 0 0 hsl(var(--foreground))",
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

// ─── Font size ────────────────────────────────────────────────────────────────

export const FONT_SIZE = {
  /** 9px — vendor marker labels in the mini-map. */
  "3xs": "9px",
  /** 10px — live badge and radio label text. */
  "2xs": "10px",
  /** 11px — status chips, distance/price tags in store cards. */
  "xs-tight": "11px",
  /** 40px — Ambulante logotype on the auth card. */
  "display-auth": "40px",
  /** Fluid clamp 32–56px — section headings that scale with viewport. */
  "display-hero": "clamp(2rem, 6vw, 3.5rem)",
} as const;

// ─── Heights ──────────────────────────────────────────────────────────────────

export const HEIGHTS = {
  /** 100dvh — full viewport including mobile address bar. */
  "screen-dvh": "100dvh",
  /** Bottom sheet snap: peeking. */
  "sheet-collapsed": "15vh",
  /** Bottom sheet snap: half-open. */
  "sheet-half": "45vh",
  /** Bottom sheet snap: fully expanded. */
  "sheet-full": "90vh",
  /** Bokeh orb decorative circle. */
  "orb-lg": "500px",
} as const;

// ─── Widths ───────────────────────────────────────────────────────────────────

export const WIDTHS = {
  /** Desktop nav description-list submenu. */
  "nav-description": "440px",
  /** Desktop nav simple/icon submenu — base. */
  "nav-sm": "420px",
  /** Desktop nav simple/icon submenu — md breakpoint. */
  "nav-md": "460px",
  /** Bokeh orb decorative circle. */
  "orb-lg": "500px",
} as const;

// ─── Max widths ───────────────────────────────────────────────────────────────

export const MAX_WIDTHS = {
  /** Small centered content block, e.g. EmptyRadius message. */
  "content-sm": "260px",
  /** Medium centered content block, e.g. LocationDenied dialog. */
  "content-md": "320px",
} as const;

// ─── Min widths ───────────────────────────────────────────────────────────────

export const MIN_WIDTHS = {
  /** Radius filter chip — ensures tap target meets 48px minimum. */
  chip: "48px",
} as const;

// ─── Line heights ─────────────────────────────────────────────────────────────

export const LINE_HEIGHTS = {
  /** Tight condensed display headings. */
  display: "0.95",
} as const;

// ─── Letter spacings ─────────────────────────────────────────────────────────

export const LETTER_SPACINGS = {
  /** Section headings — negative tracking for compressed display feel. */
  display: "-0.02em",
  /** Eyebrow labels — wide tracking for small-caps uppercase labels. */
  eyebrow: "0.2em",
  /** Tag lines — extra-wide tracking for secondary text labels. */
  tag: "0.14em",
} as const;

// ─── Blur ─────────────────────────────────────────────────────────────────────

export const BLUR_TOKENS = {
  /** Bokeh orb blur radius. */
  orb: "100px",
  /** Ambient hero glow blur radius. */
  ambient: "120px",
} as const;
