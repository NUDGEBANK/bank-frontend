import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:9999",
        changeOrigin: true,
      },
      "/chat-api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
