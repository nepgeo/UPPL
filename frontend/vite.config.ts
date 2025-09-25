import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/", // ✅ Required for Vercel deployment
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // ✅ Proxy for local dev only
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/uploads/, "/uploads"),
      },
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "/api"),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ✅ Helps debug "Cannot access 'CB' before initialization"
    minify: false,
    sourcemap: true,
    outDir: "dist", // default but explicit for Vercel
    emptyOutDir: true,
  },
}));
