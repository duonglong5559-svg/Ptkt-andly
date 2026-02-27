import type { CandleFetchResult, Timeframe } from "./types";
import { fetchBinanceCandles } from "./binance";
import { fetchStooqCandles } from "./stooq";

export type PairKind = "crypto" | "forex";

export async function fetchCandles(args: {
  kind: PairKind;
  symbol: string;
  timeframe: Timeframe;
  limit: number;
  signal?: AbortSignal;
}): Promise<CandleFetchResult> {
  if (args.kind === "crypto") {
    try {
      const { candles } = await fetchBinanceCandles({
        binanceSymbol: args.symbol,
        timeframe: args.timeframe,
        limit: args.limit,
        signal: args.signal,
      });
      if (candles.length > 0) return { source: "binance", candles };
    } catch (e) {
      // fall through to mock in caller
    }
    return { source: "mock", candles: [], warning: "Không lấy được dữ liệu Binance (CORS/proxy). Đang dùng demo." };
  }

  // forex (XAUUSD demo via Stooq daily/weekly)
  try {
    const { candles, warning } = await fetchStooqCandles({
      stooqSymbol: args.symbol,
      timeframe: args.timeframe,
      limit: args.limit,
      signal: args.signal,
    });
    if (candles.length > 0) return { source: "stooq", candles, warning };
    return { source: "mock", candles: [], warning: warning ?? "Không có dữ liệu Stooq. Đang dùng demo." };
  } catch (e) {
    return { source: "mock", candles: [], warning: "Không lấy được dữ liệu Stooq. Đang dùng demo." };
  }
}

