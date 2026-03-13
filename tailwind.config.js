/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /^(mode|accent)-.+/,
    },
    {
      pattern: /^(text|bg|border)-app-status-.+/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      // This maps the Tailwind utility classes (e.g., bg-app-canvas)
      // to the CSS variables defined in index.css
      colors: {
        app: {
          canvas: "oklch(var(--bg-canvas) / <alpha-value>)",
          frame: "oklch(var(--bg-frame) / <alpha-value>)",
          surface: "oklch(var(--bg-surface) / <alpha-value>)",
          overlay: "oklch(var(--bg-overlay) / <alpha-value>)",
          primary: "oklch(var(--text-primary) / <alpha-value>)",
          secondary: "oklch(var(--text-secondary) / <alpha-value>)",
          tertiary: "oklch(var(--text-tertiary) / <alpha-value>)",
          border: "oklch(var(--border-base) / <alpha-value>)",
          highlight: "oklch(var(--border-highlight) / <alpha-value>)",
          brand: "oklch(var(--color-brand) / <alpha-value>)",
          "brand-dim": "oklch(var(--color-brand-dim) / <alpha-value>)",
          icon: {
            primary: "oklch(var(--color-icon-primary) / <alpha-value>)",
            secondary: "oklch(var(--color-icon-secondary) / <alpha-value>)",
            tertiary: "oklch(var(--color-icon-tertiary) / <alpha-value>)",
            brand: "oklch(var(--color-icon-brand) / <alpha-value>)",
            contrast: "oklch(var(--color-icon-contrast) / <alpha-value>)",
          },
          status: {
            ready: "oklch(var(--color-status-ready) / <alpha-value>)",
            nav: "oklch(var(--color-status-nav) / <alpha-value>)",
            alert: "oklch(var(--color-status-alert) / <alpha-value>)",
            danger: "oklch(var(--color-status-danger) / <alpha-value>)",
            intel: "oklch(var(--color-status-intel) / <alpha-value>)",
            gold: "oklch(var(--color-status-gold) / <alpha-value>)",
            stealth: "oklch(var(--color-status-stealth) / <alpha-value>)",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      screens: {
        "touch-device": { raw: "(hover: none) and (pointer: coarse)" },
      },
    },
  },
  plugins: [],
};
