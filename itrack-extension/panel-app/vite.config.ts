import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../panel",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        format: "iife",
        name: "ItrackPanel",
        entryFileNames: "panel.js",
        assetFileNames: "panel.[ext]",
        inlineDynamicImports: true,
      },
    },
  },
});
