import type { Candle, Timeframe } from "./types";

type BinanceInterval =
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "1w";

function timeframeToBinanceInterval(timeframe: Timeframe): BinanceInterval | null {
  switch (timeframe) {
    case "1H":
      return "1h";
    case "2H":
      return "2h";
    case "4H":
      return "4h";
    case "6H":
      return "6h";
    case "8H":
      return "8h";
    case "12H":
      return "12h";
    case "1D":
      return "1d";
    case "1W":
      return "1w";
    default:
      return null;
  }
}

function formatDateLabel(ts: number, timeframe: Timeframe) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1);
  const dd = String(d.getDate());
  if (timeframe === "1D" || timeframe === "1W") return `${mm}/${dd}`;
  const hh = String(d.getHours()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:00`;
}

export async function fetchBinanceCandles(args: {
  binanceSymbol: string; // e.g. "BTCUSDT"
  timeframe: Timeframe;
  limit: number;
  signal?: AbortSignal;
}): Promise<{ candles: Candle[] }> {
  const interval = timeframeToBinanceInterval(args.timeframe);
  if (!interval) return { candles: [] };

  const url = `/api/binance/api/v3/klines?symbol=${encodeURIComponent(args.binanceSymbol)}&interval=${interval}&limit=${Math.min(
    1000,
    Math.max(10, args.limit)
  )}`;
  const res = await fetch(url, { signal: args.signal });
  if (!res.ok) {
    throw new Error(`Binance HTTP ${res.status}`);
  }
  const rows: unknown = await res.json();
  if (!Array.isArray(rows)) return { candles: [] };

  const candles: Candle[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const ts = Number(row[0]);
    const open = Number(row[1]);
    const high = Number(row[2]);
    const low = Number(row[3]);
    const close = Number(row[4]);
    const volume = Number(row[5]);
    if (![ts, open, high, low, close].every(Number.isFinite)) continue;
    candles.push({
      ts,
      time: formatDateLabel(ts, args.timeframe),
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    });
  }

  candles.sort((a, b) => a.ts - b.ts);
  return { candles: candles.slice(-args.limit) };
}

