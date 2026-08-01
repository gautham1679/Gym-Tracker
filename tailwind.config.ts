import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0D",
        surface: "#17171B",
        surface2: "#1F1F24",
        border: "#2A2A30",
        accent: {
          DEFAULT: "#F5C518",
          hover: "#FFD940",
          muted: "#3A331A",
        },
        muted: "#8A8A93",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(245,197,24,0.25), 0 0 24px rgba(245,197,24,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
