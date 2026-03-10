import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#0f172a",
        accent: "#b45309"
      }
    }
  },
  plugins: []
};

export default config;
