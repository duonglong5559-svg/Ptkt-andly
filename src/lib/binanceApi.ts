const BASE_URL = import.meta.env.DEV
  ? "/binance-api"
  : "https://data-api.binance.vision/api/v3";

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
}

export interface CandleData {
  time: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
}

export interface TickerData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export type BinanceInterval =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1h" | "2h" | "4h" | "6h" | "8h" | "12h"
  | "1d" | "1w" | "1M";

export const TIMEFRAME_MAP: Record<string, BinanceInterval> = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1H": "1h",
  "2H": "2h",
  "4H": "4h",
  "6H": "6h",
  "8H": "8h",
  "12H": "12h",
  "1D": "1d",
  "1W": "1w",
};

export type PairCategory = "crypto" | "commodity";

export interface TradingPairInfo {
  symbol: string;
  name: string;
  short: string;
  category: PairCategory;
  emoji: string;
}

export const TRADING_PAIRS: TradingPairInfo[] = [
  // Top crypto
  { symbol: "BTCUSDT", name: "Bitcoin", short: "BTC/USDT", category: "crypto", emoji: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", short: "ETH/USDT", category: "crypto", emoji: "Ξ" },
  { symbol: "BNBUSDT", name: "BNB", short: "BNB/USDT", category: "crypto", emoji: "◆" },
  { symbol: "SOLUSDT", name: "Solana", short: "SOL/USDT", category: "crypto", emoji: "◎" },
  { symbol: "XRPUSDT", name: "XRP", short: "XRP/USDT", category: "crypto", emoji: "✕" },
  { symbol: "DOGEUSDT", name: "Dogecoin", short: "DOGE/USDT", category: "crypto", emoji: "Ð" },
  { symbol: "ADAUSDT", name: "Cardano", short: "ADA/USDT", category: "crypto", emoji: "₳" },
  { symbol: "AVAXUSDT", name: "Avalanche", short: "AVAX/USDT", category: "crypto", emoji: "▲" },
  { symbol: "LINKUSDT", name: "Chainlink", short: "LINK/USDT", category: "crypto", emoji: "⬡" },
  { symbol: "SUIUSDT", name: "Sui", short: "SUI/USDT", category: "crypto", emoji: "💧" },
  { symbol: "TRUMPUSDT", name: "Trump", short: "TRUMP/USDT", category: "crypto", emoji: "🏛" },
  { symbol: "PEPEUSDT", name: "Pepe", short: "PEPE/USDT", category: "crypto", emoji: "🐸" },
  // Commodities (Tokenized)
  { symbol: "PAXGUSDT", name: "Vàng (Gold)", short: "GOLD/USDT", category: "commodity", emoji: "🥇" },
];

function formatTimeLabel(ts: number, interval: BinanceInterval): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const dd = d.getDate();
  const mo = d.getMonth() + 1;

  if (["1m", "3m", "5m", "15m", "30m"].includes(interval)) {
    return `${hh}:${mm}`;
  }
  if (["1h", "2h", "4h"].includes(interval)) {
    return `${mo}/${dd} ${hh}:${mm}`;
  }
  return `${mo}/${dd}`;
}

export async function fetchKlines(
  symbol: string,
  interval: BinanceInterval,
  limit: number = 100,
): Promise<CandleData[]> {
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const data: any[][] = await res.json();

  return data.map((k) => ({
    time: k[0] as number,
    timeLabel: formatTimeLabel(k[0] as number, interval),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    quoteVolume: parseFloat(k[7]),
    trades: k[8] as number,
  }));
}

export async function fetchTicker(symbol: string): Promise<TickerData> {
  const url = `${BASE_URL}/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const d = await res.json();

  return {
    symbol: d.symbol,
    lastPrice: parseFloat(d.lastPrice),
    priceChange: parseFloat(d.priceChange),
    priceChangePercent: parseFloat(d.priceChangePercent),
    highPrice: parseFloat(d.highPrice),
    lowPrice: parseFloat(d.lowPrice),
    volume: parseFloat(d.volume),
    quoteVolume: parseFloat(d.quoteVolume),
  };
}

export async function fetchMultipleTickers(symbols: string[]): Promise<TickerData[]> {
  const url = `${BASE_URL}/ticker/24hr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  const all: any[] = await res.json();

  return all
    .filter((d) => symbols.includes(d.symbol))
    .map((d) => ({
      symbol: d.symbol,
      lastPrice: parseFloat(d.lastPrice),
      priceChange: parseFloat(d.priceChange),
      priceChangePercent: parseFloat(d.priceChangePercent),
      highPrice: parseFloat(d.highPrice),
      lowPrice: parseFloat(d.lowPrice),
      volume: parseFloat(d.volume),
      quoteVolume: parseFloat(d.quoteVolume),
    }));
}
