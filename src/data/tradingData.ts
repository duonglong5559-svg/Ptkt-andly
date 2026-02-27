export const timeframes = ["1H", "2H", "4H", "6H", "8H", "12H", "1D", "1W"] as const;
export type Timeframe = (typeof timeframes)[number];
export type TradingSignal = "Long" | "Short" | "Neutral";
export type MarketType = "crypto_futures" | "forex_spot";
export type TrendDirection = "Tăng" | "Giảm" | "Sideway";

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingPair {
  symbol: string;
  name: string;
  marketType: MarketType;
  venue: string;
  llmModel: string;
  currentPrice: number;
  pivotPrice: number;
  buyPrice: number;
  sellPrice: number;
  bullish: number;
  bearish: number;
  signal: TradingSignal;
  trendLines: number;
}

export interface TechnicalSnapshot {
  pivotPoint: number;
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  ema20: number;
  ema50: number;
  rsi: number;
  atr: number;
  macd: number;
  macdSignal: number;
  volumeRatio: number;
  trend: TrendDirection;
  signal: TradingSignal;
  llmBias: "Bullish" | "Bearish" | "Neutral";
  highProbabilityScore: number;
  qualifiesForAnalysis: boolean;
  llmReasons: string[];
}

export interface ResistanceLevel {
  id: string;
  type: "resistance" | "support";
  price: number;
  label: string;
  source: string;
  strength: "Rất mạnh" | "Mạnh" | "Trung bình";
  confidence: number;
  testCount: number;
  riskReward: string;
  riskRewardRatio: number;
  scalpPrice: number;
  swingPrice: number;
  stopLoss: number;
  stopLossChange: string;
  pattern: string;
  action: string;
  isAuto: boolean;
  highProbability: boolean;
}

const timeframeHours: Record<Timeframe, number> = {
  "1H": 1,
  "2H": 2,
  "4H": 4,
  "6H": 6,
  "8H": 8,
  "12H": 12,
  "1D": 24,
  "1W": 24 * 7,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toFixedPrice = (value: number) => Number(value.toFixed(Math.abs(value) >= 100 ? 2 : 4));

const toRiskRewardText = (ratio: number) => `1:${ratio.toFixed(1)}`;

const hashSeed = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const getForexSessionMultiplier = (utcHour: number) => {
  if ((utcHour >= 6 && utcHour <= 9) || (utcHour >= 12 && utcHour <= 16)) {
    return 1.25;
  }
  if (utcHour >= 0 && utcHour <= 3) {
    return 0.82;
  }
  return 1;
};

const calculateEMA = (values: number[], period: number) => {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
};

const calculateRSI = (closes: number[], period: number = 14) => {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    if (change < 0) losses -= change;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
};

const calculateATR = (candles: CandleData[], period: number = 14) => {
  if (candles.length < 2) return 0;
  const start = Math.max(1, candles.length - period);
  let sum = 0;
  let count = 0;

  for (let i = start; i < candles.length; i++) {
    const candle = candles[i];
    const prevClose = candles[i - 1].close;
    const trueRange = Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevClose),
      Math.abs(candle.low - prevClose)
    );
    sum += trueRange;
    count += 1;
  }

  return count === 0 ? 0 : sum / count;
};

const classifyStrength = (
  confidence: number,
  testCount: number
): ResistanceLevel["strength"] => {
  if (confidence >= 88 && testCount >= 4) return "Rất mạnh";
  if (confidence >= 80 && testCount >= 3) return "Mạnh";
  return "Trung bình";
};

const parseRiskRewardRatio = (riskReward: string) => {
  const [, ratioPart] = riskReward.split(":");
  const parsed = Number(ratioPart);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getMarketLabel = (marketType: MarketType) =>
  marketType === "forex_spot" ? "Forex Spot" : "Crypto Futures";

export const tradingPairs: TradingPair[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    marketType: "crypto_futures",
    venue: "Binance Futures",
    llmModel: "gpt-market-core-v2",
    currentPrice: 66047.63,
    pivotPrice: 65358.27,
    buyPrice: 66047.63,
    sellPrice: 67226.57,
    bullish: 71,
    bearish: 29,
    signal: "Long",
    trendLines: 8,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    marketType: "crypto_futures",
    venue: "Bybit Perpetual",
    llmModel: "gpt-market-core-v2",
    currentPrice: 3456.78,
    pivotPrice: 3380.5,
    buyPrice: 3456.78,
    sellPrice: 3520,
    bullish: 62,
    bearish: 38,
    signal: "Long",
    trendLines: 6,
  },
  {
    symbol: "BNB/USDT",
    name: "Binance Coin",
    marketType: "crypto_futures",
    venue: "OKX Futures",
    llmModel: "gpt-market-core-v2",
    currentPrice: 598.45,
    pivotPrice: 585.2,
    buyPrice: 598.45,
    sellPrice: 612.3,
    bullish: 55,
    bearish: 45,
    signal: "Neutral",
    trendLines: 4,
  },
  {
    symbol: "XRP/USDT",
    name: "Ripple",
    marketType: "crypto_futures",
    venue: "Binance Futures",
    llmModel: "gpt-market-core-v2",
    currentPrice: 2.3456,
    pivotPrice: 2.28,
    buyPrice: 2.3456,
    sellPrice: 2.41,
    bullish: 68,
    bearish: 32,
    signal: "Long",
    trendLines: 6,
  },
  {
    symbol: "XAUUSD",
    name: "Gold Spot",
    marketType: "forex_spot",
    venue: "OANDA Forex",
    llmModel: "gpt-forex-precision-v1",
    currentPrice: 2348.42,
    pivotPrice: 2339.3,
    buyPrice: 2348.42,
    sellPrice: 2360.2,
    bullish: 58,
    bearish: 42,
    signal: "Long",
    trendLines: 7,
  },
];

export function generateCandleData(
  pair: TradingPair,
  timeframe: Timeframe = "4H",
  count: number = 90
): CandleData[] {
  const candles: CandleData[] = [];
  const random = createSeededRandom(hashSeed(`${pair.symbol}-${timeframe}`));
  const timeframeHour = timeframeHours[timeframe];
  const volatility = Math.max(pair.currentPrice * (pair.marketType === "forex_spot" ? 0.0016 : 0.0055), 0.001);
  const trendBias = (pair.bullish - pair.bearish) / 100;
  let close = pair.currentPrice * (1 - trendBias * 0.015);
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i * timeframeHour);
    const sessionMultiplier =
      pair.marketType === "forex_spot"
        ? getForexSessionMultiplier(date.getUTCHours())
        : 1 + Math.sin(i / 8) * 0.1;

    const open = close;
    const meanReversion = (pair.currentPrice - open) * 0.03;
    const directionalDrift = trendBias * volatility * 0.28;
    const noise = (random() - 0.5) * volatility * 1.2 * sessionMultiplier;
    const nextClose = Math.max(0.0001, open + directionalDrift + meanReversion + noise);
    const wick = Math.max(Math.abs(nextClose - open), volatility * 0.55) * (0.65 + random());
    const high = Math.max(open, nextClose) + wick * (0.35 + random() * 0.4);
    const low = Math.min(open, nextClose) - wick * (0.35 + random() * 0.4);
    const volumeBase = pair.marketType === "forex_spot" ? 3200 : 680;
    const volume = Math.floor(volumeBase * sessionMultiplier * (0.65 + random() * 0.8));

    candles.push({
      time: `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:00`,
      open: toFixedPrice(open),
      high: toFixedPrice(high),
      low: toFixedPrice(low),
      close: toFixedPrice(nextClose),
      volume,
    });

    close = nextClose;
  }

  if (candles.length > 0) {
    const tailStart = Math.max(0, candles.length - 4);
    for (let i = tailStart; i < candles.length; i++) {
      const blend = (i - tailStart + 1) / (candles.length - tailStart + 1);
      candles[i].close = toFixedPrice(candles[i].close * (1 - blend) + pair.currentPrice * blend);
      candles[i].high = toFixedPrice(Math.max(candles[i].high, candles[i].close));
      candles[i].low = toFixedPrice(Math.min(candles[i].low, candles[i].close));
    }

    const last = candles[candles.length - 1];
    last.close = toFixedPrice(pair.currentPrice);
    last.high = toFixedPrice(Math.max(last.high, pair.currentPrice));
    last.low = toFixedPrice(Math.min(last.low, pair.currentPrice));
  }

  return candles;
}

export function getTechnicalSnapshot(pair: TradingPair, candles: CandleData[]): TechnicalSnapshot {
  if (candles.length === 0) {
    return {
      pivotPoint: pair.pivotPrice,
      r1: pair.pivotPrice * 1.01,
      s1: pair.pivotPrice * 0.99,
      r2: pair.pivotPrice * 1.02,
      s2: pair.pivotPrice * 0.98,
      ema20: pair.currentPrice,
      ema50: pair.currentPrice,
      rsi: 50,
      atr: pair.currentPrice * 0.005,
      macd: 0,
      macdSignal: 0,
      volumeRatio: 1,
      trend: "Sideway",
      signal: pair.signal,
      llmBias: pair.signal === "Long" ? "Bullish" : pair.signal === "Short" ? "Bearish" : "Neutral",
      highProbabilityScore: 50,
      qualifiesForAnalysis: false,
      llmReasons: ["Không đủ dữ liệu nến để đánh giá."],
    };
  }

  const closes = candles.map((candle) => candle.close);
  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2] ?? lastCandle;
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const atr = calculateATR(candles, 14);

  const macdSeries = closes.map((_, index) => {
    const subset = closes.slice(0, index + 1);
    return calculateEMA(subset, 12) - calculateEMA(subset, 26);
  });
  const macd = macdSeries[macdSeries.length - 1] ?? 0;
  const macdSignal = calculateEMA(macdSeries, 9);

  const pivotPoint = (previousCandle.high + previousCandle.low + previousCandle.close) / 3;
  const r1 = 2 * pivotPoint - previousCandle.low;
  const s1 = 2 * pivotPoint - previousCandle.high;
  const r2 = pivotPoint + (previousCandle.high - previousCandle.low);
  const s2 = pivotPoint - (previousCandle.high - previousCandle.low);

  const averageVolume =
    candles.slice(-20).reduce((sum, candle) => sum + candle.volume, 0) / Math.min(candles.length, 20);
  const volumeRatio = averageVolume ? lastCandle.volume / averageVolume : 1;

  const trend: TrendDirection =
    ema20 > ema50 * 1.001 ? "Tăng" : ema20 < ema50 * 0.999 ? "Giảm" : "Sideway";

  const isBullish = trend === "Tăng" && lastCandle.close >= pivotPoint && rsi >= 48 && macd >= macdSignal;
  const isBearish = trend === "Giảm" && lastCandle.close <= pivotPoint && rsi <= 52 && macd <= macdSignal;
  const signal: TradingSignal = isBullish ? "Long" : isBearish ? "Short" : "Neutral";
  const llmBias = signal === "Long" ? "Bullish" : signal === "Short" ? "Bearish" : "Neutral";

  const momentumScore = clamp(
    (signal === "Long" ? 1 : signal === "Short" ? -1 : 0) * 18 +
      (rsi >= 45 && rsi <= 67 ? 22 : 12) +
      (macd >= macdSignal ? 16 : 10),
    0,
    52
  );
  const structureScore = clamp(
    (Math.abs(lastCandle.close - pivotPoint) <= Math.max(atr * 1.8, pair.currentPrice * 0.006) ? 16 : 7) +
      (trend !== "Sideway" ? 18 : 9),
    0,
    34
  );
  const volumeScore = clamp(volumeRatio * 14, 4, 14);
  const highProbabilityScore = Math.round(clamp(momentumScore + structureScore + volumeScore, 0, 100));
  const qualifiesForAnalysis = highProbabilityScore >= 70 && (signal !== "Neutral" || volumeRatio >= 1.05);

  const llmReasons = [
    `Pivot chuẩn: PP ${toFixedPrice(pivotPoint)} | R1 ${toFixedPrice(r1)} | S1 ${toFixedPrice(s1)}.`,
    `EMA20 ${toFixedPrice(ema20)} so với EMA50 ${toFixedPrice(ema50)} xác nhận xu hướng ${trend.toLowerCase()}.`,
    `RSI ${rsi.toFixed(1)} và MACD ${(macd - macdSignal).toFixed(3)} cho tín hiệu ${signal.toLowerCase()}.`,
    `Volume ratio ${volumeRatio.toFixed(2)}x, điểm kèo xác suất cao: ${highProbabilityScore}/100.`,
  ];

  return {
    pivotPoint: toFixedPrice(pivotPoint),
    r1: toFixedPrice(r1),
    s1: toFixedPrice(s1),
    r2: toFixedPrice(r2),
    s2: toFixedPrice(s2),
    ema20: toFixedPrice(ema20),
    ema50: toFixedPrice(ema50),
    rsi,
    atr: toFixedPrice(atr),
    macd: Number(macd.toFixed(4)),
    macdSignal: Number(macdSignal.toFixed(4)),
    volumeRatio: Number(volumeRatio.toFixed(2)),
    trend,
    signal,
    llmBias,
    highProbabilityScore,
    qualifiesForAnalysis,
    llmReasons,
  };
}

export function getResistanceLevels(
  pair: TradingPair,
  candles: CandleData[],
  snapshot?: TechnicalSnapshot
): ResistanceLevel[] {
  const technical = snapshot ?? getTechnicalSnapshot(pair, candles);
  const atr = technical.atr || pair.currentPrice * 0.0045;

  const candidates: Array<{
    id: string;
    type: ResistanceLevel["type"];
    price: number;
    source: string;
    testCount: number;
    pattern: string;
    action: string;
  }> = [
    {
      id: "r1",
      type: "resistance",
      price: technical.r1,
      source: "Pivot R1",
      testCount: 4,
      pattern: "Bearish rejection",
      action: "Ưu tiên short khi có nến xác nhận + volume.",
    },
    {
      id: "r2",
      type: "resistance",
      price: technical.r2,
      source: "Pivot R2",
      testCount: 3,
      pattern: "Double top",
      action: "Chỉ phân tích breakout nếu volume > 1.2x.",
    },
    {
      id: "s1",
      type: "support",
      price: technical.s1,
      source: "Pivot S1",
      testCount: 4,
      pattern: "Bullish rejection",
      action: "Ưu tiên long khi giữ được vùng hỗ trợ.",
    },
    {
      id: "s2",
      type: "support",
      price: technical.s2,
      source: "Pivot S2",
      testCount: 3,
      pattern: "Spring + absorption",
      action: "Chỉ phân tích nếu có xác nhận đảo chiều.",
    },
  ];

  const generated = candidates
    .map((candidate): ResistanceLevel => {
      const isResistance = candidate.type === "resistance";
      const rawDistance = Math.abs(candidate.price - pair.currentPrice);
      const atrDistance = rawDistance / Math.max(atr, 0.0001);
      const reward = isResistance
        ? Math.max(candidate.price - technical.s1, atr * 1.2)
        : Math.max(technical.r1 - candidate.price, atr * 1.2);
      const risk = isResistance
        ? Math.max(technical.r2 - candidate.price, atr * 0.8)
        : Math.max(candidate.price - technical.s2, atr * 0.8);
      const rrRatio = clamp(reward / Math.max(risk, atr * 0.45), 1.1, 3.2);
      const confidence = Math.round(
        clamp(
          64 +
            candidate.testCount * 5.8 +
            technical.highProbabilityScore * 0.13 +
            (technical.qualifiesForAnalysis ? 6 : 0) -
            atrDistance * 4.2,
          60,
          95
        )
      );
      const strength = classifyStrength(confidence, candidate.testCount);
      const riskReward = toRiskRewardText(rrRatio);
      const parsedRatio = parseRiskRewardRatio(riskReward);
      const highProbability =
        confidence >= 82 && candidate.testCount >= 3 && parsedRatio >= 1.7 && strength !== "Trung bình";

      const scalpPrice = isResistance ? candidate.price - atr * 0.25 : candidate.price + atr * 0.25;
      const swingPrice = isResistance ? candidate.price - atr * 1.6 : candidate.price + atr * 1.6;
      const stopLoss = isResistance ? candidate.price + atr * 0.9 : candidate.price - atr * 0.9;

      return {
        id: `${pair.symbol}-${candidate.id}`,
        type: candidate.type,
        price: toFixedPrice(candidate.price),
        label: isResistance ? "KHÁNG CỰ CỨNG" : "HỖ TRỢ CỨNG",
        source: candidate.source,
        strength,
        confidence,
        testCount: candidate.testCount,
        riskReward,
        riskRewardRatio: parsedRatio,
        scalpPrice: toFixedPrice(scalpPrice),
        swingPrice: toFixedPrice(swingPrice),
        stopLoss: toFixedPrice(stopLoss),
        stopLossChange: `${isResistance ? "+" : "-"}${((atr * 0.9 * 100) / pair.currentPrice).toFixed(2)}%`,
        pattern: candidate.pattern,
        action: candidate.action,
        isAuto: true,
        highProbability,
      };
    })
    .filter((level) => level.highProbability);

  const resistance = generated
    .filter((level) => level.type === "resistance")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);
  const support = generated
    .filter((level) => level.type === "support")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  return [...resistance, ...support];
}
