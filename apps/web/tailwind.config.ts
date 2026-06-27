import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand blue — exact values from design spec ──
        brand: {
          50:  "#F0F8FF",
          100: "#D1E7FF", // spec: matching accent
          200: "#A3CFFF",
          300: "#75B7FF",
          400: "#3A96FF",
          500: "#006FFD", // spec: main buttons
          600: "#005FD4",
          700: "#004FAB",
          800: "#003F82",
          900: "#181935", // spec: deep navy accent
        },
        // ── Surfaces ──
        bg:       "#F6FDFF", // spec: page background
        surface:  "#FFFFFF",
        "surface-2": "#F0F8FF",
        // ── Text ──
        "text-primary":   "#1F2024", // spec
        "text-secondary": "#727272", // spec
        "text-muted":     "#A0A3A8",
        // ── Borders ──
        border:   "#E3EFFF", // spec: card stroke
        "border-2": "#C8DFFE",
        // ── Semantic ──
        success:  "#10B981",
        warning:  "#F59E0B",
        danger:   "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:        "0 1px 3px 0 rgba(0,111,253,0.06), 0 4px 16px 0 rgba(0,111,253,0.07)",
        "card-hover":"0 8px 32px 0 rgba(0,111,253,0.16), 0 2px 8px 0 rgba(0,111,253,0.08)",
        nav:         "0 1px 0 0 #E3EFFF",
        modal:       "0 24px 64px 0 rgba(24,25,53,0.16)",
        glow:        "0 0 0 4px rgba(0,111,253,0.16)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(160deg, #F6FDFF 0%, #EBF4FF 60%, #F6FDFF 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #006FFD 0%, #3A96FF 100%)",
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};

export default config;
