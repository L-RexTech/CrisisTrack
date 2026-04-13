import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Dev-only plugin: serves /api/crude-oil via server-side Node.js fetches
// (no CORS issues) — tries multiple Yahoo Finance hosts + cookie headers.
function devCrudeOilPlugin(): Plugin {
  const YAHOO_CANDIDATES = [
    "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=8d&includePrePost=false",
    "https://query2.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=8d&includePrePost=false",
  ];
  const BROWSER_HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Accept: "application/json,*/*;q=0.9",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Origin: "https://finance.yahoo.com",
    Referer: "https://finance.yahoo.com/quote/CL=F/",
    "Cache-Control": "no-cache",
  };
  return {
    name: "dev-crude-oil-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/crude-oil", async (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        for (const url of YAHOO_CANDIDATES) {
          try {
            const r = await fetch(url, { headers: BROWSER_HEADERS });
            if (!r.ok) { console.warn("[dev-api] Yahoo returned", r.status, url); continue; }
            const data = await r.text();
            res.statusCode = 200;
            res.end(data);
            return;
          } catch (e: any) {
            console.warn("[dev-api] fetch error", url, e.message);
          }
        }
        res.statusCode = 502;
        res.end(JSON.stringify({ error: "All Yahoo Finance hosts failed" }));
      });
    },
  };
}

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
  plugins: [react(), tailwindcss(), devCrudeOilPlugin(), ...replitPlugins],
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
