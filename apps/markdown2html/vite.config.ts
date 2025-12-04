import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { copyPdfWorker } from "./vite-plugin-copy-pdf-worker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vue(), copyPdfWorker()],
  server: {
    host: "0.0.0.0",
    port: 3002,
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // 新增：把 crypto 映射到 crypto-browserify
      crypto: "crypto-browserify",
    },
  },
  // 新增：esbuild 注入全局 crypto
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis", // 解决全局对象问题
      },
    },
  },
  build: {
    target: "es2020",
    // 新增：打包时注入 crypto
    rollupOptions: {
      external: [],
      plugins: [],
    },
  },
});