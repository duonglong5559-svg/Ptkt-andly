import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/binance-api": {
        target: "https://data-api.binance.vision",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/binance-api/, "/api/v3"),
        secure: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
