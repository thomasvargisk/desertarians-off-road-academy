import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desert: {
          bg: "hsl(var(--background) / <alpha-value>)",
          fg: "hsl(var(--foreground) / <alpha-value>)",
          muted: "hsl(var(--muted) / <alpha-value>)",
          accent: "hsl(var(--accent) / <alpha-value>)",
          card: "hsl(var(--card) / <alpha-value>)",
          border: "hsl(var(--border) / <alpha-value>)",
        },
        night: {
          bg1: "#050505",
          bg2: "#0e0e0e",
          fg: "#e8e4dc",
          fgMuted: "#7a7a7a",
          accent: "#d4b486",
        },
      },
      fontFamily: {
        display: ["Verdana", "Geneva", "sans-serif"],
        body: ["Verdana", "Geneva", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
