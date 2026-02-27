# AGENTS.md

## Cursor Cloud specific instructions

This is a crypto/forex trading analysis web app built with Vite + React + TypeScript + Shadcn UI + Tailwind CSS.

### Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Shadcn UI
- **Data**: Binance public API (via `data-api.binance.vision` due to geo-restrictions on `api.binance.com`)
- **Dev server**: `npm run dev` (port 8080, uses Vite proxy for CORS)

### Key commands
- `npm run dev` — start dev server on port 8080
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest

### Important notes
- The Binance API at `api.binance.com` is **geo-blocked** in this environment (HTTP 451). Use `data-api.binance.vision` instead. The Vite proxy config in `vite.config.ts` handles this for dev.
- CORS: all Binance API calls go through the Vite dev server proxy at `/binance-api` → `data-api.binance.vision/api/v3`.
- The app uses no backend; all analysis (candle patterns, pivot, S/R, AI scoring) runs client-side.
- Drawing tools state is in-memory only (not persisted).
