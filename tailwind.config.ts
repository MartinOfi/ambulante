import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
        // Always-dark accent surface — stays dark regardless of theme
        ink: "hsl(var(--ink))",
        // Aliases for shadcn-style primitives (mapped onto Ambulante tokens)
        background: "hsl(var(--surface))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--brand-primary))",
        primary: {
          DEFAULT: "hsl(var(--brand-primary))",
          foreground: "hsl(0 0% 100%)",
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
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        sheet: "28px",
      },
      boxShadow: {
        pin: "0 4px 12px rgba(234, 88, 12, 0.35)",
        sheet: "0 -8px 32px rgba(15, 23, 42, 0.12)",
        fab: "0 8px 24px rgba(234, 88, 12, 0.45)",
      },
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
      animation: {
        "pulse-pin": "pulse-pin 2s ease-out infinite",
        "fade-up": "fade-up 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
