import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#94a3b8",      // Changed to a darker gray (Slate-400)
        input: "#e2e8f0",       // Slightly darker input background
        ring: "#6366f1",        // Keeping the indigo focus ring
        background: "#ffffff",   // White background
        foreground: "#1e293b",  // Dark slate for text
        primary: {
          DEFAULT: "#4f46e5",   // Indigo-600
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f5f9",   // Slate-100
          foreground: "#1e293b",
        },
        destructive: {
          DEFAULT: "#ef4444",   // Red-500
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8fafc",   // Slate-50
          foreground: "#64748b", // Slate-500
        },
        accent: {
          DEFAULT: "#f1f5f9",   // Slate-100
          foreground: "#0f172a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1e293b",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1e293b",
          border: "#cbd5e1",    // Added specific card border color (Slate-300)
        },
        // Keep your existing indigo colors
        indigo: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
} satisfies Config

export default config
