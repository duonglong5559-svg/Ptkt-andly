import type { Candle, Timeframe } from "./types";

type StooqInterval = "d" | "w" | "m";

function timeframeToStooqInterval(timeframe: Timeframe): StooqInterval | null {
  switch (timeframe) {
    case "1D":
      return "d";
    case "1W":
      return "w";
    default:
      return null;
  }
}

function formatDateLabel(ts: number) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1);
  const dd = String(d.getDate());
  return `${mm}/${dd}`;
}

export async function fetchStooqCandles(args: {
  stooqSymbol: string; // e.g. "xauusd"
  timeframe: Timeframe;
  limit: number;
  signal?: AbortSignal;
}): Promise<{ candles: Candle[]; warning?: string }> {
  const interval = timeframeToStooqInterval(args.timeframe);
  if (!interval) {
    return {
      candles: [],
      warning: "Stooq chỉ hỗ trợ D/W/M. Intraday cần datafeed broker (OANDA/FXCM/MT5).",
    };
  }

  const url = `/api/stooq/q/d/l/?s=${encodeURIComponent(args.stooqSymbol)}&i=${interval}`;
  const res = await fetch(url, { signal: args.signal });
  if (!res.ok) {
    throw new Error(`Stooq HTTP ${res.status}`);
  }
  const csv = await res.text();

  // CSV: Date,Open,High,Low,Close,Volume
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return { candles: [] };

  const candles: Candle[] = [];
  for (const line of lines.slice(1)) {
    const [dateStr, o, h, l, c, v] = line.split(",");
    const ts = Date.parse(dateStr);
    if (!Number.isFinite(ts)) continue;

    const open = Number(o);
    const high = Number(h);
    const low = Number(l);
    const close = Number(c);
    const volume = Number(v ?? 0) || 0;
    if (![open, high, low, close].every(Number.isFinite)) continue;

    candles.push({
      ts,
      time: formatDateLabel(ts),
      open,
      high,
      low,
      close,
      volume,
    });
  }

  candles.sort((a, b) => a.ts - b.ts);
  return { candles: candles.slice(-args.limit) };
}

