/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Brand Colors
        brand: {
          primary: "#0066FF",     // Vibrant Blue
          secondary: "#00D9FF",   // Cyan
          accent: "#FF6B35",      // Coral Orange
          dark: "#1a202c",
          light: "#f8f9fa",
        },
        // Safety-specific palette
        safety: {
          safe: "#10B981",        // Green
          alert: "#F59E0B",       // Amber
          danger: "#EF4444",      // Red
          critical: "#7C3AED",    // Purple
        },
        // Neutral scale
        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        }
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        elevation: [
          "0px 2px 4px rgba(0, 0, 0, 0.06)",
          "0px 8px 20px rgba(0, 0, 0, 0.08)"
        ].join(','),
        elevated: [
          "0px 12px 32px rgba(0, 0, 0, 0.12)",
          "0px 24px 64px rgba(0, 0, 0, 0.16)"
        ].join(','),
        glow: "0 0 20px rgba(0, 102, 255, 0.3)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        slide: "slide 0.3s ease-out",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        slide: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
