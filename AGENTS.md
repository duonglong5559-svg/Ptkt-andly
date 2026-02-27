# AGENTS.md

## Cursor Cloud specific instructions

This repo is a Vite + React + TypeScript trading dashboard demo (Tailwind + shadcn UI). It includes:

- Candlestick chart with **resizable (drag) height**
- Market data fetch (dev-time proxy) for:
  - Crypto candles via **Binance spot klines**
  - XAUUSD daily/weekly via **Stooq**
- Hard support/resistance + classic pivot points (computed from candles)
- Optional Liquiheart liquidity heatmap integration (env-driven)
- Local dataset capture/export (JSONL) for LLM fine-tune workflows

### Setup

- Install dependencies: `npm ci`

### Run (dev)

- Start dev server: `npm run dev`
- App listens on `http://localhost:8080` (see `vite.config.ts`).

Notes:
- Vite dev proxy routes:
  - `/api/binance/*` -> `data-api.binance.vision`
  - `/api/binance_futures/*` -> `fapi.binance.com`
  - `/api/stooq/*` -> `stooq.com`

### Tests / checks

- Unit tests: `npm test`
- Lint: `npm run lint`
- Build: `npm run build`

### Optional env vars

- `VITE_LIQUIHEART_API_URL`: Liquiheart endpoint returning `{ zones: [{ low, high, intensity, label? }] }`
- `VITE_LIQUIHEART_API_KEY`: Bearer token (optional)

When application code is added, update this file with relevant setup, run, and test instructions.
