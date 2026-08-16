/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#080c14",
          900: "#0d131f",
          850: "#121a2a",
          800: "#182236",
          700: "#24324c",
          600: "#384a6c",
        },
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          accent: "#f97316",
          cyan: "#06b6d4",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        display: ["Barlow Condensed", "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(34, 197, 94, 0.3)",
        "glow-orange": "0 0 25px -5px rgba(249, 115, 22, 0.3)",
        "glow-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce 2s infinite",
      },
    },
  },
  plugins: [],
};
