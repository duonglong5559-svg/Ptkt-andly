export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResistanceLevel {
  id: string;
  type: "resistance" | "support";
  price: number;
  label: string;
  strength: "Rất mạnh" | "Mạnh" | "Trung bình";
  confidence: number;
  testCount: number;
  riskReward: string;
  scalpPrice: number;
  swingPrice: number;
  stopLoss: number;
  stopLossChange: string;
  pattern: string;
  action: string;
  isAuto: boolean;
}

export interface TradingPair {
  symbol: string;
  name: string;
  currentPrice: number;
  pivotPrice: number;
  buyPrice: number;
  sellPrice: number;
  bullish: number;
  bearish: number;
  signal: "Long" | "Short" | "Neutral";
  trendLines: number;
}

export const tradingPairs: TradingPair[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    currentPrice: 66047.63,
    pivotPrice: 65358.27,
    buyPrice: 66047.63,
    sellPrice: 67226.57,
    bullish: 71,
    bearish: 29,
    signal: "Short",
    trendLines: 8,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    currentPrice: 3456.78,
    pivotPrice: 3380.5,
    buyPrice: 3456.78,
    sellPrice: 3520.0,
    bullish: 62,
    bearish: 38,
    signal: "Long",
    trendLines: 5,
  },
  {
    symbol: "XAUUSD",
    name: "Vàng (Forex)",
    currentPrice: 2654.82,
    pivotPrice: 2648.15,
    buyPrice: 2654.82,
    sellPrice: 2668.5,
    bullish: 58,
    bearish: 42,
    signal: "Long",
    trendLines: 4,
  },
  {
    symbol: "BNB/USDT",
    name: "Binance Coin",
    currentPrice: 598.45,
    pivotPrice: 585.2,
    buyPrice: 598.45,
    sellPrice: 612.3,
    bullish: 55,
    bearish: 45,
    signal: "Neutral",
    trendLines: 3,
  },
  {
    symbol: "XRP/USDT",
    name: "Ripple",
    currentPrice: 2.3456,
    pivotPrice: 2.28,
    buyPrice: 2.3456,
    sellPrice: 2.41,
    bullish: 68,
    bearish: 32,
    signal: "Long",
    trendLines: 6,
  },
];

export function generateCandleData(pair: TradingPair, count: number = 50): CandleData[] {
  const candles: CandleData[] = [];
  let price = pair.currentPrice * 0.96;
  const volMult = pair.symbol.includes("XAU") ? 0.004 : 0.008;
  const volatility = pair.currentPrice * volMult;

  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i * 4);

    const open = price + (Math.random() - 0.48) * volatility;
    const close = open + (Math.random() - 0.45) * volatility * 1.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000 + 200);

    candles.push({
      time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  const lastCandle = candles[candles.length - 1];
  lastCandle.close = pair.currentPrice;
  lastCandle.high = Math.max(lastCandle.high, pair.currentPrice);
  lastCandle.low = Math.min(lastCandle.low, pair.currentPrice);

  return candles;
}

/** Ngưỡng confidence tối thiểu - chỉ lấy kháng cự/hỗ trợ cứng */
const MIN_CONFIDENCE_SOLID = 85;

/** Chỉ lấy các level có confidence >= ngưỡng (cứng) */
export function getResistanceLevels(
  pair: TradingPair,
  options?: { minConfidence?: number; usePivotFromCandles?: boolean }
): ResistanceLevel[] {
  const minConf = options?.minConfidence ?? MIN_CONFIDENCE_SOLID;
  const p = pair.currentPrice;

  const all: ResistanceLevel[] = [
    {
      id: "r1",
      type: "resistance",
      price: Number((p * 1.0227).toFixed(2)),
      label: "KHÁNG CỰ",
      strength: "Rất mạnh",
      confidence: 91,
      testCount: 4,
      riskReward: "1:1.6",
      scalpPrice: Number((p * 1.0133).toFixed(2)),
      swingPrice: Number((p * 1.034).toFixed(2)),
      stopLoss: Number((p * 1.044).toFixed(2)),
      stopLossChange: "+0.6%",
      pattern: "Bearish Engulfing",
      action: "Quan sát breakout hoặc rejection",
      isAuto: true,
    },
    {
      id: "r2",
      type: "resistance",
      price: Number((p * 1.0275).toFixed(2)),
      label: "KHÁNG CỰ",
      strength: "Mạnh",
      confidence: 83,
      testCount: 4,
      riskReward: "1:1.6",
      scalpPrice: Number((p * 1.018).toFixed(2)),
      swingPrice: Number((p * 1.04).toFixed(2)),
      stopLoss: Number((p * 1.05).toFixed(2)),
      stopLossChange: "+0.6%",
      pattern: "Bearish Engulfing",
      action: "Quan sát breakout hoặc rejection",
      isAuto: true,
    },
    {
      id: "r3",
      type: "resistance",
      price: Number((p * 1.045).toFixed(2)),
      label: "KHÁNG CỰ",
      strength: "Trung bình",
      confidence: 72,
      testCount: 2,
      riskReward: "1:2.1",
      scalpPrice: Number((p * 1.035).toFixed(2)),
      swingPrice: Number((p * 1.055).toFixed(2)),
      stopLoss: Number((p * 1.06).toFixed(2)),
      stopLossChange: "+0.5%",
      pattern: "Double Top",
      action: "Chờ xác nhận rejection",
      isAuto: true,
    },
    {
      id: "s1",
      type: "support",
      price: Number((p * 0.99).toFixed(2)),
      label: "HỖ TRỢ",
      strength: "Rất mạnh",
      confidence: 89,
      testCount: 5,
      riskReward: "1:1.8",
      scalpPrice: Number((p * 0.995).toFixed(2)),
      swingPrice: Number((p * 0.98).toFixed(2)),
      stopLoss: Number((p * 0.975).toFixed(2)),
      stopLossChange: "-0.5%",
      pattern: "Bullish Engulfing",
      action: "Quan sát bounce hoặc breakdown",
      isAuto: true,
    },
    {
      id: "s2",
      type: "support",
      price: Number((p * 0.975).toFixed(2)),
      label: "HỖ TRỢ",
      strength: "Mạnh",
      confidence: 78,
      testCount: 3,
      riskReward: "1:2.0",
      scalpPrice: Number((p * 0.982).toFixed(2)),
      swingPrice: Number((p * 0.965).toFixed(2)),
      stopLoss: Number((p * 0.96).toFixed(2)),
      stopLossChange: "-0.5%",
      pattern: "Hammer",
      action: "Chờ xác nhận bounce",
      isAuto: false,
    },
  ];

  return all.filter((l) => l.confidence >= minConf);
}

export const timeframes = ["6H", "8H", "12H", "1H", "2H", "4H", "1D", "1W"] as const;
export type Timeframe = (typeof timeframes)[number];
