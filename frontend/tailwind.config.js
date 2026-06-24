/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F4",
        "paper-dim": "#F1ECE2",
        ink: "#1C2B33",
        "ink-soft": "#3B4A52",
        ledger: "#3D6B5C",
        "ledger-dark": "#2A4D42",
        "ledger-light": "#E8F0EC",
        rust: "#C4622D",
        "rust-light": "#FBE9DD",
        sand: "#8B8378",
        hairline: "#E2DCCE",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        stamp: "0 1px 2px rgba(28,43,51,0.06), 0 4px 12px rgba(28,43,51,0.05)",
      },
      keyframes: {
        stampIn: {
          "0%": { opacity: "0", transform: "scale(1.4) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(0.95) rotate(-3deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-3deg)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        stampIn: "stampIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        riseIn: "riseIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
