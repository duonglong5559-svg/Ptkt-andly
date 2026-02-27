# AGENTS.md

## Cursor Cloud specific instructions

Trading dashboard (Crypto + Forex) với phân tích kỹ thuật, AI, thanh khoản.

### Setup
```bash
npm install
cp .env.example .env
# Thêm API key vào .env (tùy chọn): Twelve Data, ExchangeRate, Coinglass
```

### Chạy
```bash
npm run dev
```

### Build
```bash
npm run build
```

### API Keys (optional)
- `VITE_TWELVE_DATA_API_KEY` - Forex/crypto OHLC (XAUUSD, etc.)
- `VITE_EXCHANGERATE_API_KEY` - Giá vàng XAUUSD
- `VITE_COINGLASS_API_KEY` - Liquidation map / thanh khoản
