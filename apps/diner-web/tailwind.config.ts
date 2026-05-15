import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#15120d",
        accent: "#9b6b43",
        cream: "#f6f0e8"
      },
      fontFamily: {
        sans: ["Apercu", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Aeonik", "Apercu", "Inter", "Helvetica Neue", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
