/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic Color Tokens ─────────────────────────────────────────
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        card: "var(--card)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",

        // ── Premium Emerald (primary action color) ──────────────────────
        primary: {
          DEFAULT: "var(--primary, #1F7A68)",
          50: "#EDFAF6",
          100: "#DDEFE9",
          200: "#AFDDD3",
          300: "#7CCABB",
          400: "#4AB5A3",
          500: "#1F7A68",
          600: "#186154",
          700: "#124940",
          800: "#0B302A",
          900: "#051815",
        },
        // ── Premium Navy ─────────────────────────────────────────────────
        navy: {
          DEFAULT: "var(--navy, #16324F)",
          50: "#EBF1F7",
          100: "#C9D9EA",
          200: "#97B5D4",
          300: "#6591BD",
          400: "#3D71A7",
          500: "#16324F",
          600: "#12283F",
          700: "#0D1E2F",
          800: "#09131F",
          900: "#040A0F",
        },
        // ── Champagne Gold ───────────────────────────────────────────────
        champagne: {
          DEFAULT: "var(--champagne, #C6A15B)",
          50: "#FDF8EF",
          100: "#F8EDD7",
          200: "#F0D9AB",
          300: "#E8C47F",
          400: "#D6B06A",
          500: "#C6A15B",
          600: "#A8854A",
          700: "#896939",
          800: "#6A4D28",
          900: "#4C3318",
        },
        // ── Warm Ivory Backgrounds ────────────────────────────────────────
        ivory: {
          DEFAULT: "#F7F6F2",
          50: "#FDFCFA",
          100: "#F7F6F2",
          200: "#F1EFE9",
          300: "#E7E5E0",
          400: "#D4D1CA",
          500: "#BCBAB3",
        },
        // ── System Status colors ──────────────────────────────────────────
        success: "#2F855A",
        warning: "#D69E2E",
        error: "#C05656",
        danger: "#C05656",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      boxShadow: {
        // Light-mode premium shadows
        soft: "0 1px 3px rgba(22,50,79,0.06), 0 1px 2px rgba(22,50,79,0.04)",
        card: "0 4px 12px rgba(22,50,79,0.08), 0 1px 4px rgba(22,50,79,0.04)",
        hover: "0 12px 28px rgba(22,50,79,0.12), 0 4px 8px rgba(22,50,79,0.06)",
        premium: "0 8px 32px rgba(22,50,79,0.10), 0 2px 8px rgba(22,50,79,0.06)",
        "glow-emerald": "0 0 20px rgba(31,122,104,0.20)",
        "glow-navy": "0 0 20px rgba(22,50,79,0.18)",
        "glow-gold": "0 0 20px rgba(198,161,91,0.22)",
        // Keep backward-compat dark aliases
        "glow-primary": "0 0 20px rgba(31,122,104,0.20)",
        "glow-accent": "0 0 20px rgba(198,161,91,0.22)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-slow": "fadeIn 1s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-up-fade": "slideUpFade 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
        "scale-in": "scaleIn 0.3s ease-out",
        "cinema-exit": "cinemaExit 0.8s cubic-bezier(0.22,1,0.36,1) forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "bounce-subtle": "bounceSoft 1.5s ease-in-out infinite",
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUpFade: {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        cinemaExit: {
          "0%": { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
          "100%": { opacity: "0", transform: "scale(1.04)", filter: "blur(8px)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "calc(400px + 100%) 0" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.05)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
