import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "#E7E6F8",
        input: "#E7E6F8",
        ring: "#211CC3",
        background: "#FFFFFF",
        foreground: "#0A0944",
        primary: {
          DEFAULT: "#211CC3",
          50: "#EEF0FF",
          100: "#E0E2FF",
          200: "#C2C5FF",
          300: "#9CA0F5",
          400: "#7176E8",
          500: "#211CC3",
          600: "#1B17A6",
          700: "#161389",
          800: "#100E66",
          900: "#0A0944",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E7E6F8",
          foreground: "#211CC3",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#A4A3A4",
          foreground: "#A4A3A4",
        },
        accent: {
          DEFAULT: "#EAE549",
          foreground: "#211CC3",
        },
        lavender: {
          DEFAULT: "#9290E2",
          light: "#E7E6F8",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
