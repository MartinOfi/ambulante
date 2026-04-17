import type { Config } from "tailwindcss";
// Relative import intentional: tailwind.config.ts runs in Node.js outside the
// Next.js compiler, so @/ path aliases are not available here.
import {
  AUTH_COLORS,
  BLUR_TOKENS,
  COLORS,
  FONT_SIZE,
  HEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS,
  MAX_WIDTHS,
  MIN_WIDTHS,
  MOTION,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  WIDTHS,
} from "./shared/styles/tokens";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ...COLORS.cssVarRefs, auth: AUTH_COLORS },
      fontFamily: {
        display: [TYPOGRAPHY.fontFamilies.display, "system-ui", "sans-serif"],
        sans: [TYPOGRAPHY.fontFamilies.sans, "system-ui", "sans-serif"],
      },
      fontSize: FONT_SIZE,
      borderRadius: RADIUS,
      boxShadow: SHADOWS,
      height: HEIGHTS,
      width: WIDTHS,
      minWidth: MIN_WIDTHS,
      maxWidth: MAX_WIDTHS,
      lineHeight: LINE_HEIGHTS,
      letterSpacing: LETTER_SPACINGS,
      blur: BLUR_TOKENS,
      keyframes: MOTION.keyframes,
      animation: Object.fromEntries(
        Object.entries(MOTION.animations).map(([name, { value }]) => [name, value]),
      ),
      // 3% opacity not in Tailwind default scale (0, 5, 10…) — needed for subtle bg tints
      opacity: { "3": "0.03" },
    },
  },
  plugins: [],
};

export default config;
