# CrisisTrack — Global Disruption Monitor

## Overview

A futuristic dark-themed financial & global events dashboard deployable to Vercel or GitHub Pages as a static site. No backend required.

## Artifacts

- **crisis-dashboard** (at `/`) — main React + Vite dashboard app
- **api-server** (at `/api`) — shared backend (not used by dashboard)

## Free APIs Used (zero subscription, no credit card)

| Data | API | Auth required |
|------|-----|---------------|
| Crypto prices + sparklines | CoinGecko v3 | None |
| FX rates (EUR, GBP, JPY, CHF) | open.er-api.com | None |
| Seismic events | USGS Earthquake Hazards Feed | None |

## Deploying to Vercel / GitHub Pages

For **Vercel**: push the repo, set root to `artifacts/crisis-dashboard`, build command `pnpm run build`, output dir `dist/public`.

For **GitHub Pages**: run `pnpm --filter @workspace/crisis-dashboard run build` and serve the `dist/public` folder.

---

# Workspace (original)

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
