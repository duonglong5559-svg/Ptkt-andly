# AGENTS.md

## Cursor Cloud specific instructions

This is a React/TypeScript trading dashboard application using Vite, Tailwind CSS, and shadcn/ui components.

### Setup
```bash
npm install
```

### Development
```bash
npm run dev     # Starts dev server on port 8080
npm run build   # Production build
npm run lint    # ESLint
npm run test    # Vitest
```

### Architecture
- `src/pages/TradingDashboard.tsx` — Main dashboard page
- `src/components/` — UI components (chart, tabs, AI, liquidity heatmap, etc.)
- `src/data/tradingData.ts` — Trading data models, technical indicator calculations, mock data generators
- `src/lib/utils.ts` — Utility functions

### Key Features
- Candlestick chart with zoom/pan/resize
- XAU/USD (Forex) + crypto pairs
- Technical indicators: RSI, MACD, EMA, ATR, Pivot Points
- AI Trading Assistant (LLM-style)
- Liquidity Heatmap
- Support/Resistance with strength filtering
- Futures trading data
