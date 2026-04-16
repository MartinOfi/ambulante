import type { Config } from "tailwindcss";
// Relative import intentional: tailwind.config.ts runs in Node.js outside the
// Next.js compiler, so @/ path aliases are not available here.
import { COLORS, MOTION, RADIUS, SHADOWS, TYPOGRAPHY } from "./shared/styles/tokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: COLORS.cssVarRefs,
      fontFamily: {
        display: [TYPOGRAPHY.fontFamilies.display, "system-ui", "sans-serif"],
        sans: [TYPOGRAPHY.fontFamilies.sans, "system-ui", "sans-serif"],
      },
      borderRadius: RADIUS,
      boxShadow: SHADOWS,
      keyframes: MOTION.keyframes,
      animation: Object.fromEntries(
        Object.entries(MOTION.animations).map(([name, { value }]) => [
          name,
          value,
        ])
      ),
    },
  },
  plugins: [],
};

export default config;
