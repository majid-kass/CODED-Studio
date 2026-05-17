import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coded: {
          navy: "#14243F",
          blue: "#004AA3",
          grey: "#D2D2D2",
          black: "#1A1A1A",
        },
        aiapp: {
          primary: "#00B9B4",
          bg: "#026678",
          cyan: "#16D7D1",
          aqua: "#62FFE5",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 80px rgba(98,255,229,0.35), 0 0 160px rgba(22,215,209,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
