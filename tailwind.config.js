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
          canvas: "rgb(var(--bg-canvas) / <alpha-value>)",
          frame: "rgb(var(--bg-frame) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          overlay: "rgb(var(--bg-overlay) / <alpha-value>)",
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--text-tertiary) / <alpha-value>)",
          border: "rgb(var(--border-base) / <alpha-value>)",
          highlight: "rgb(var(--border-highlight) / <alpha-value>)",
          brand: "rgb(var(--color-brand) / <alpha-value>)",
          "brand-dim": "rgb(var(--color-brand-dim) / <alpha-value>)",
          status: {
            ready: "rgb(var(--color-status-ready) / <alpha-value>)",
            nav: "rgb(var(--color-status-nav) / <alpha-value>)",
            alert: "rgb(var(--color-status-warning) / <alpha-value>)",
            danger: "rgb(var(--color-status-critical) / <alpha-value>)",
            intel: "rgb(var(--color-status-intel) / <alpha-value>)",
            elite: "rgb(var(--color-status-elite) / <alpha-value>)",
            stealth: "rgb(var(--color-status-stealth) / <alpha-value>)",
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
