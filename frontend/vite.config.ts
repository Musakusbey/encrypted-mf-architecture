import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    cors: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          crypto: ["crypto-js"],
          state: ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
  define: {
    global: "globalThis",
  },
});
