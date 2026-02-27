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
  category: "crypto" | "forex";
  decimals: number;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiSignal: string;
  macd: { value: number; signal: number; histogram: number };
  macdSignal: string;
  ema20: number;
  ema50: number;
  ema200: number;
  emaCross: string;
  atr: number;
  volume: string;
  pivotPoints: PivotPoints;
  probability: number;
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface FuturesData {
  fundingRate: number;
  nextFunding: string;
  openInterest: number;
  openInterestChange: number;
  longRatio: number;
  shortRatio: number;
  liquidations24h: { long: number; short: number };
  topTraderLongShort: number;
  volume24h: number;
}

export interface LiquidityLevel {
  price: number;
  volume: number;
  type: "bid" | "ask";
  strength: number;
}

export interface LiquidityData {
  levels: LiquidityLevel[];
  maxVolume: number;
  bidTotal: number;
  askTotal: number;
  imbalance: number;
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
    category: "crypto",
    decimals: 2,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    currentPrice: 3456.78,
    pivotPrice: 3380.50,
    buyPrice: 3456.78,
    sellPrice: 3520.00,
    bullish: 62,
    bearish: 38,
    signal: "Long",
    trendLines: 5,
    category: "crypto",
    decimals: 2,
  },
  {
    symbol: "XAU/USD",
    name: "Gold (Forex)",
    currentPrice: 2341.50,
    pivotPrice: 2328.75,
    buyPrice: 2341.50,
    sellPrice: 2356.20,
    bullish: 65,
    bearish: 35,
    signal: "Long",
    trendLines: 7,
    category: "forex",
    decimals: 2,
  },
  {
    symbol: "BNB/USDT",
    name: "Binance Coin",
    currentPrice: 598.45,
    pivotPrice: 585.20,
    buyPrice: 598.45,
    sellPrice: 612.30,
    bullish: 55,
    bearish: 45,
    signal: "Neutral",
    trendLines: 3,
    category: "crypto",
    decimals: 2,
  },
  {
    symbol: "XRP/USDT",
    name: "Ripple",
    currentPrice: 2.3456,
    pivotPrice: 2.2800,
    buyPrice: 2.3456,
    sellPrice: 2.4100,
    bullish: 68,
    bearish: 32,
    signal: "Long",
    trendLines: 6,
    category: "crypto",
    decimals: 4,
  },
];

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  let atrSum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    atrSum += tr;
  }
  return atrSum / period;
}

export function calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);
  return { pivot, r1, r2, r3, s1, s2, s3 };
}

export function calculateTechnicalIndicators(candles: CandleData[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(closes);
  let rsiSignal = "Trung tính";
  if (rsi > 70) rsiSignal = "Quá mua";
  else if (rsi > 60) rsiSignal = "Thiên tăng";
  else if (rsi < 30) rsiSignal = "Quá bán";
  else if (rsi < 40) rsiSignal = "Thiên giảm";

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const macdValue = macdLine[macdLine.length - 1];
  const signalValue = signalLine[signalLine.length - 1];
  const histogram = macdValue - signalValue;

  let macdSignal = "Trung tính";
  if (macdValue > signalValue && histogram > 0) macdSignal = "Bullish crossover";
  else if (macdValue < signalValue && histogram < 0) macdSignal = "Bearish crossover";

  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200Arr = closes.length >= 200 ? calculateEMA(closes, 200) : calculateEMA(closes, Math.min(closes.length, 50));
  const ema20Val = ema20[ema20.length - 1];
  const ema50Val = ema50[ema50.length - 1];
  const ema200Val = ema200Arr[ema200Arr.length - 1];

  let emaCross = "Trung tính";
  if (ema20Val > ema50Val) emaCross = "Golden cross";
  else if (ema20Val < ema50Val) emaCross = "Death cross";

  const atr = calculateATR(candles);

  const recentVol = candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
  const avgVol = candles.reduce((s, c) => s + c.volume, 0) / candles.length;
  const volume = recentVol > avgVol * 1.2 ? "Trên trung bình" : recentVol < avgVol * 0.8 ? "Dưới trung bình" : "Trung bình";

  const last = candles[candles.length - 1];
  const dayHigh = Math.max(...candles.slice(-6).map((c) => c.high));
  const dayLow = Math.min(...candles.slice(-6).map((c) => c.low));
  const pivotPoints = calculatePivotPoints(dayHigh, dayLow, last.close);

  const bullishSignals = [
    rsi > 50 && rsi < 70,
    macdValue > signalValue,
    ema20Val > ema50Val,
    last.close > pivotPoints.pivot,
    recentVol > avgVol,
  ].filter(Boolean).length;
  const probability = Math.round((bullishSignals / 5) * 100);

  return {
    rsi: Number(rsi.toFixed(1)),
    rsiSignal,
    macd: { value: Number(macdValue.toFixed(4)), signal: Number(signalValue.toFixed(4)), histogram: Number(histogram.toFixed(4)) },
    macdSignal,
    ema20: Number(ema20Val.toFixed(2)),
    ema50: Number(ema50Val.toFixed(2)),
    ema200: Number(ema200Val.toFixed(2)),
    emaCross,
    atr: Number(atr.toFixed(2)),
    volume,
    pivotPoints,
    probability,
  };
}

export function generateFuturesData(pair: TradingPair): FuturesData {
  const seed = pair.currentPrice * 1000;
  const pseudoRand = (n: number) => ((Math.sin(seed + n) * 10000) % 1 + 1) % 1;

  const longRatio = 48 + pseudoRand(1) * 10;
  const shortRatio = 100 - longRatio;

  return {
    fundingRate: Number(((pseudoRand(2) - 0.4) * 0.06).toFixed(4)),
    nextFunding: `${Math.floor(pseudoRand(3) * 7 + 1)}h ${Math.floor(pseudoRand(4) * 59)}m`,
    openInterest: Math.round(pair.currentPrice * (1500 + pseudoRand(5) * 3000) * 1000),
    openInterestChange: Number(((pseudoRand(6) - 0.45) * 8).toFixed(2)),
    longRatio: Number(longRatio.toFixed(1)),
    shortRatio: Number(shortRatio.toFixed(1)),
    liquidations24h: {
      long: Math.round(pseudoRand(7) * pair.currentPrice * 50000),
      short: Math.round(pseudoRand(8) * pair.currentPrice * 40000),
    },
    topTraderLongShort: Number((0.8 + pseudoRand(9) * 0.8).toFixed(2)),
    volume24h: Math.round(pair.currentPrice * (5000 + pseudoRand(10) * 15000) * 1000),
  };
}

export function generateLiquidityData(pair: TradingPair, candles: CandleData[]): LiquidityData {
  const price = pair.currentPrice;
  const atr = candles.length > 14 ? calculateATR(candles) : price * 0.01;
  const levels: LiquidityLevel[] = [];
  const steps = 20;

  for (let i = 0; i < steps; i++) {
    const offset = ((i - steps / 2) / steps) * atr * 4;
    const levelPrice = price + offset;
    const distFromPrice = Math.abs(offset) / atr;
    const baseVol = Math.max(100, 1000 - distFromPrice * 200);
    const vol = baseVol * (0.5 + Math.random());

    levels.push({
      price: Number(levelPrice.toFixed(pair.decimals)),
      volume: Math.round(vol),
      type: levelPrice > price ? "ask" : "bid",
      strength: Number(Math.min(1, vol / 800).toFixed(2)),
    });
  }

  levels.sort((a, b) => b.price - a.price);
  const bidTotal = levels.filter((l) => l.type === "bid").reduce((s, l) => s + l.volume, 0);
  const askTotal = levels.filter((l) => l.type === "ask").reduce((s, l) => s + l.volume, 0);
  const maxVolume = Math.max(...levels.map((l) => l.volume));

  return {
    levels,
    maxVolume,
    bidTotal,
    askTotal,
    imbalance: Number(((bidTotal - askTotal) / (bidTotal + askTotal) * 100).toFixed(1)),
  };
}

export function generateCandleData(pair: TradingPair, count: number = 50): CandleData[] {
  const candles: CandleData[] = [];
  let price = pair.currentPrice * 0.96;
  const volatility = pair.currentPrice * (pair.category === "forex" ? 0.004 : 0.008);

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
      open: Number(open.toFixed(pair.decimals)),
      high: Number(high.toFixed(pair.decimals)),
      low: Number(low.toFixed(pair.decimals)),
      close: Number(close.toFixed(pair.decimals)),
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

export function getResistanceLevels(pair: TradingPair, candles?: CandleData[]): ResistanceLevel[] {
  const p = pair.currentPrice;
  const atr = candles && candles.length > 14 ? calculateATR(candles) : p * 0.01;

  const allLevels: ResistanceLevel[] = [
    {
      id: "r1",
      type: "resistance",
      price: Number((p + atr * 1.5).toFixed(pair.decimals)),
      label: "KHÁNG CỰ",
      strength: "Rất mạnh",
      confidence: 91,
      testCount: 4,
      riskReward: "1:1.6",
      scalpPrice: Number((p + atr * 0.8).toFixed(pair.decimals)),
      swingPrice: Number((p + atr * 2.2).toFixed(pair.decimals)),
      stopLoss: Number((p + atr * 2.8).toFixed(pair.decimals)),
      stopLossChange: "+0.6%",
      pattern: "Bearish Engulfing",
      action: "Quan sát breakout hoặc rejection",
      isAuto: true,
    },
    {
      id: "r2",
      type: "resistance",
      price: Number((p + atr * 2.5).toFixed(pair.decimals)),
      label: "KHÁNG CỰ",
      strength: "Mạnh",
      confidence: 83,
      testCount: 4,
      riskReward: "1:1.6",
      scalpPrice: Number((p + atr * 1.8).toFixed(pair.decimals)),
      swingPrice: Number((p + atr * 3.2).toFixed(pair.decimals)),
      stopLoss: Number((p + atr * 3.8).toFixed(pair.decimals)),
      stopLossChange: "+0.6%",
      pattern: "Bearish Engulfing",
      action: "Quan sát breakout hoặc rejection",
      isAuto: true,
    },
    {
      id: "r3",
      type: "resistance",
      price: Number((p + atr * 3.8).toFixed(pair.decimals)),
      label: "KHÁNG CỰ",
      strength: "Trung bình",
      confidence: 72,
      testCount: 2,
      riskReward: "1:2.1",
      scalpPrice: Number((p + atr * 3.0).toFixed(pair.decimals)),
      swingPrice: Number((p + atr * 4.5).toFixed(pair.decimals)),
      stopLoss: Number((p + atr * 5.0).toFixed(pair.decimals)),
      stopLossChange: "+0.5%",
      pattern: "Double Top",
      action: "Chờ xác nhận rejection",
      isAuto: true,
    },
    {
      id: "s1",
      type: "support",
      price: Number((p - atr * 1.2).toFixed(pair.decimals)),
      label: "HỖ TRỢ",
      strength: "Rất mạnh",
      confidence: 89,
      testCount: 5,
      riskReward: "1:1.8",
      scalpPrice: Number((p - atr * 0.6).toFixed(pair.decimals)),
      swingPrice: Number((p - atr * 2.0).toFixed(pair.decimals)),
      stopLoss: Number((p - atr * 2.5).toFixed(pair.decimals)),
      stopLossChange: "-0.5%",
      pattern: "Bullish Engulfing",
      action: "Quan sát bounce hoặc breakdown",
      isAuto: true,
    },
    {
      id: "s2",
      type: "support",
      price: Number((p - atr * 2.4).toFixed(pair.decimals)),
      label: "HỖ TRỢ",
      strength: "Mạnh",
      confidence: 78,
      testCount: 3,
      riskReward: "1:2.0",
      scalpPrice: Number((p - atr * 1.8).toFixed(pair.decimals)),
      swingPrice: Number((p - atr * 3.2).toFixed(pair.decimals)),
      stopLoss: Number((p - atr * 3.8).toFixed(pair.decimals)),
      stopLossChange: "-0.5%",
      pattern: "Hammer",
      action: "Chờ xác nhận bounce",
      isAuto: false,
    },
  ];

  return allLevels;
}

export const timeframes = ["1H", "2H", "4H", "6H", "8H", "12H", "1D", "1W"] as const;
export type Timeframe = (typeof timeframes)[number];
