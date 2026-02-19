import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    // Ensure a single React instance so react-grid-layout (and other deps) don't see undefined
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // React + react-grid-layout + react-resizable MUST be in the SAME chunk
            // or grid gets undefined React and throws "Cannot set properties of undefined (setting 'Children')"
            if (
              id.includes("react-dom") ||
              id.includes("react/") ||
              id.includes("react-grid-layout") ||
              id.includes("react-resizable")
            ) {
              return "react";
            }
            if (id.includes("@tanstack/react-query")) return "query";
            if (id.includes("chart.js") || id.includes("react-chartjs")) return "charts";
            if (id.includes("radix-ui") || id.includes("@radix-ui")) return "radix";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
