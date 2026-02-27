/**
 * Forex API - Lấy dữ liệu XAUUSD và các cặp forex từ sàn
 * Hỗ trợ: Twelve Data, ExchangeRate-API, Alpha Vantage
 * Cần API key trong .env: VITE_FOREX_API_KEY
 */

export interface ForexCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ForexQuote {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  timestamp: string;
}

const FOREX_PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"] as const;

/** Twelve Data - free tier 800 req/day */
async function fetchTwelveData(symbol: string, interval: string = "4h"): Promise<ForexCandle[]> {
  const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
  if (!apiKey) return [];

  const intervalMap: Record<string, string> = {
    "1H": "1h",
    "2H": "2h",
    "4H": "4h",
    "1D": "1day",
    "1W": "1week",
  };

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${intervalMap[interval] || "4h"}&outputsize=50&apikey=${apiKey}`
    );
    const data = await res.json();
    if (data.values) {
      return data.values
        .map((v: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }) => ({
          timestamp: v.datetime,
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          volume: v.volume ? parseFloat(v.volume) : undefined,
        }))
        .reverse();
    }
  } catch (e) {
    console.warn("Twelve Data API error:", e);
  }
  return [];
}

/** ExchangeRate-API - free gold price (XAU/USD) */
async function fetchGoldPrice(): Promise<number | null> {
  const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/XAU`
    : "https://api.exchangerate-api.com/v4/latest/USD";

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.rates?.USD) return 1 / data.rates.USD;
    if (data.conversion_rates?.XAU) return 1 / data.conversion_rates.XAU;
  } catch (e) {
    console.warn("ExchangeRate API error:", e);
  }
  return null;
}

/** FCS API - free forex/crypto (no key) */
async function fetchFCSQuote(symbol: string): Promise<ForexQuote | null> {
  const map: Record<string, string> = {
    XAUUSD: "XAU/USD",
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
  };
  const pair = map[symbol] || symbol;

  try {
    const res = await fetch(`https://api.fcsapi.com/v3/forex/latest?symbol=${pair}&access_key=YOUR_KEY`);
    const data = await res.json();
    if (data.response?.c) {
      return {
        symbol: pair,
        price: parseFloat(data.response.c),
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // FCS needs paid key, skip
  }
  return null;
}

/** Public API chính - ưu tiên Twelve Data nếu có key */
export async function fetchForexCandles(symbol: string, timeframe: string): Promise<ForexCandle[]> {
  const candles = await fetchTwelveData(symbol, timeframe);
  return candles;
}

/** Lấy giá spot XAUUSD (vàng) - fallback về giá mẫu nếu không có API */
export async function fetchXAUUSDPrice(): Promise<number | null> {
  const price = await fetchGoldPrice();
  return price;
}

/** Kiểm tra có thể dùng API forex không */
export function hasForexApiKey(): boolean {
  return !!(
    import.meta.env.VITE_TWELVE_DATA_API_KEY ||
    import.meta.env.VITE_EXCHANGERATE_API_KEY
  );
}

export { FOREX_PAIRS };
