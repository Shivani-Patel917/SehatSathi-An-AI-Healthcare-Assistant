
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#0D9488",
          cyan: "#14B8A6",
          blue: "#2563EB",
        },
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 23, 42, 0.04)",
        glow: "0 12px 32px rgba(13, 148, 136, 0.12)",
      },
      borderRadius: {
        card: "1rem",
      },
    },
  },
  plugins: [],
};
