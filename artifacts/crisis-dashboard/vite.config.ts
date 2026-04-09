import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// PORT and BASE_PATH are only required inside the Replit dev environment.
// On Vercel / GitHub Pages these are not set, so we use safe defaults.
const isReplit = !!process.env.REPL_ID;

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const basePath = process.env.BASE_PATH ?? "/";

const replitPlugins = isReplit
  ? [
      process.env.NODE_ENV !== "production"
        ? await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default())
        : null,
      process.env.NODE_ENV !== "production"
        ? await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
          )
        : null,
      process.env.NODE_ENV !== "production"
        ? await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner())
        : null,
    ].filter(Boolean)
  : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
