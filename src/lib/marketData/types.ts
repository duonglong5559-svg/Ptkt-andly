export type MarketDataSource = "mock" | "stooq" | "binance";

export type Timeframe =
  | "1H"
  | "2H"
  | "4H"
  | "6H"
  | "8H"
  | "12H"
  | "1D"
  | "1W";

export interface Candle {
  ts: number; // unix ms
  time: string; // UI label
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleFetchResult {
  source: MarketDataSource;
  candles: Candle[];
  warning?: string;
}

