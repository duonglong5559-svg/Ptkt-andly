import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchKlines,
  fetchTicker,
  CandleData,
  TickerData,
  TIMEFRAME_MAP,
  BinanceInterval,
} from "@/lib/binanceApi";
import {
  detectCandlePatterns,
  calculatePivotPoints,
  calculateATR,
  calculateRSI,
  calculateMACD,
  detectSRLevels,
  generateEntrySignal,
  calculateSentiment,
  detectTrendLines,
  generateEntryMarkers,
  runAIAnalysis,
  CandlePattern,
  PivotPoints,
  SRLevel,
  EntrySignal,
  TrendLine,
  EntryMarker,
  AIAnalysisScore,
} from "@/lib/technicalAnalysis";

export interface TradingAnalysis {
  candles: CandleData[];
  ticker: TickerData | null;
  patterns: CandlePattern[];
  pivot: PivotPoints | null;
  atr: number;
  rsi: number;
  macd: ReturnType<typeof calculateMACD> | null;
  srLevels: SRLevel[];
  signal: EntrySignal;
  sentiment: { bullish: number; bearish: number };
  trendLines: TrendLine[];
  entryMarkers: EntryMarker[];
  aiScore: AIAnalysisScore;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

const REFRESH_INTERVALS: Record<string, number> = {
  "1m": 5_000,
  "3m": 10_000,
  "5m": 15_000,
  "15m": 30_000,
  "30m": 30_000,
  "1H": 60_000,
  "2H": 60_000,
  "4H": 120_000,
  "6H": 120_000,
  "8H": 120_000,
  "12H": 300_000,
  "1D": 300_000,
  "1W": 600_000,
};

export function useBinanceData(symbol: string, timeframe: string): TradingAnalysis {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const interval: BinanceInterval = TIMEFRAME_MAP[timeframe] || "4h";
      const [klines, tick] = await Promise.all([
        fetchKlines(symbol, interval, 100),
        fetchTicker(symbol),
      ]);

      setCandles(klines);
      setTicker(tick);
      setLastUpdate(Date.now());
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối Binance API");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadData(true);
    const ms = REFRESH_INTERVALS[timeframe] || 60_000;
    intervalRef.current = setInterval(() => loadData(false), ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData, timeframe]);

  const patterns = detectCandlePatterns(candles);
  const pivot = calculatePivotPoints(candles);
  const atr = calculateATR(candles);
  const rsi = calculateRSI(candles);
  const macd = candles.length > 26 ? calculateMACD(candles) : null;
  const currentPrice = ticker?.lastPrice || candles[candles.length - 1]?.close || 0;
  const srLevels = detectSRLevels(candles, currentPrice, atr, patterns);
  const defaultMacd = { macd: 0, signal: 0, histogram: 0, crossover: false, crossunder: false };
  const signal = generateEntrySignal(candles, pivot, patterns, srLevels, rsi, macd || defaultMacd, atr);
  const sentiment = calculateSentiment(candles);
  const trendLines = detectTrendLines(candles);
  const entryMarkers = generateEntryMarkers(candles, signal);
  const aiScore = runAIAnalysis(candles, pivot, patterns, srLevels, rsi, macd || defaultMacd, atr, sentiment);

  return {
    candles,
    ticker,
    patterns,
    pivot,
    atr,
    rsi,
    macd,
    srLevels,
    signal,
    sentiment,
    trendLines,
    entryMarkers,
    aiScore,
    loading,
    error,
    lastUpdate,
  };
}
