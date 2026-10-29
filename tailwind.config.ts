import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { canvas: "#09090b", surface: "#111114", coral: "#ff865f" } } },
  plugins: [],
} satisfies Config;
