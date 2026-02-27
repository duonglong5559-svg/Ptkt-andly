import { CandleData } from "./binanceApi";

// ─── Candle pattern names (Vietnamese) ───
export type CandlePatternType =
  | "Bullish Engulfing"
  | "Bearish Engulfing"
  | "Hammer"
  | "Inverted Hammer"
  | "Shooting Star"
  | "Hanging Man"
  | "Doji"
  | "Dragonfly Doji"
  | "Gravestone Doji"
  | "Morning Star"
  | "Evening Star"
  | "Three White Soldiers"
  | "Three Black Crows"
  | "Piercing Line"
  | "Dark Cloud Cover"
  | "Spinning Top"
  | "Marubozu Tăng"
  | "Marubozu Giảm"
  | "Tweezer Top"
  | "Tweezer Bottom";

export interface CandlePattern {
  type: CandlePatternType;
  direction: "bullish" | "bearish" | "neutral";
  strength: number; // 1-3
  index: number;
  description: string;
}

export interface PivotPoints {
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface SRLevel {
  id: string;
  type: "resistance" | "support";
  price: number;
  strength: "Rất mạnh" | "Mạnh" | "Trung bình";
  confidence: number;
  testCount: number;
  riskReward: string;
  pattern: CandlePatternType | string;
  action: string;
  scalpEntry: number;
  scalpTP: number;
  swingTP: number;
  stopLoss: number;
  slPercent: string;
  isAuto: boolean;
}

export interface EntrySignal {
  type: "Long" | "Short" | "Neutral";
  reason: string;
  confidence: number;
  entry: number;
  tp1: number;
  tp2: number;
  sl: number;
  rr: string;
}

// ─── TREND LINE ───
export interface TrendLine {
  id: string;
  type: "resistance" | "support";
  startIndex: number;
  endIndex: number;
  startPrice: number;
  endPrice: number;
  slope: number;
  touches: number;
  strength: number;
}

// ─── ENTRY MARKER on chart ───
export interface EntryMarker {
  index: number;
  price: number;
  type: "entry" | "tp1" | "tp2" | "sl";
  direction: "long" | "short";
  label: string;
}

// ─── AI ANALYSIS SCORE ───
export interface AIAnalysisScore {
  overall: number;
  trendScore: number;
  momentumScore: number;
  volumeScore: number;
  patternScore: number;
  srScore: number;
  volatilityScore: number;
  verdict: string;
  details: string[];
}

// ─── Helpers ───
function bodySize(c: CandleData): number {
  return Math.abs(c.close - c.open);
}
function upperWick(c: CandleData): number {
  return c.high - Math.max(c.open, c.close);
}
function lowerWick(c: CandleData): number {
  return Math.min(c.open, c.close) - c.low;
}
function totalRange(c: CandleData): number {
  return c.high - c.low;
}
function isBullish(c: CandleData): boolean {
  return c.close > c.open;
}
function isBearish(c: CandleData): boolean {
  return c.close < c.open;
}

// ─── CANDLE PATTERN DETECTION ───
export function detectCandlePatterns(candles: CandleData[]): CandlePattern[] {
  const patterns: CandlePattern[] = [];
  if (candles.length < 3) return patterns;

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const range = totalRange(curr);
    if (range === 0) continue;

    const body = bodySize(curr);
    const uWick = upperWick(curr);
    const lWick = lowerWick(curr);
    const bodyRatio = body / range;

    // Doji
    if (bodyRatio < 0.1) {
      if (lWick > range * 0.6) {
        patterns.push({
          type: "Dragonfly Doji",
          direction: "bullish",
          strength: 2,
          index: i,
          description: "Dragonfly Doji - tín hiệu đảo chiều tăng",
        });
      } else if (uWick > range * 0.6) {
        patterns.push({
          type: "Gravestone Doji",
          direction: "bearish",
          strength: 2,
          index: i,
          description: "Gravestone Doji - tín hiệu đảo chiều giảm",
        });
      } else {
        patterns.push({
          type: "Doji",
          direction: "neutral",
          strength: 1,
          index: i,
          description: "Doji - thị trường do dự",
        });
      }
      continue;
    }

    // Spinning Top
    if (bodyRatio < 0.3 && uWick > body * 0.5 && lWick > body * 0.5) {
      patterns.push({
        type: "Spinning Top",
        direction: "neutral",
        strength: 1,
        index: i,
        description: "Spinning Top - không rõ xu hướng",
      });
      continue;
    }

    // Marubozu
    if (bodyRatio > 0.9) {
      if (isBullish(curr)) {
        patterns.push({
          type: "Marubozu Tăng",
          direction: "bullish",
          strength: 3,
          index: i,
          description: "Marubozu Tăng - lực mua áp đảo",
        });
      } else {
        patterns.push({
          type: "Marubozu Giảm",
          direction: "bearish",
          strength: 3,
          index: i,
          description: "Marubozu Giảm - lực bán áp đảo",
        });
      }
      continue;
    }

    // Hammer / Hanging Man
    if (lWick >= body * 2 && uWick < body * 0.5) {
      if (i >= 3 && candles.slice(i - 3, i).every((c) => isBearish(c))) {
        patterns.push({
          type: "Hammer",
          direction: "bullish",
          strength: 2,
          index: i,
          description: "Hammer - tín hiệu đảo chiều tăng sau xu hướng giảm",
        });
      } else {
        patterns.push({
          type: "Hanging Man",
          direction: "bearish",
          strength: 2,
          index: i,
          description: "Hanging Man - cảnh báo đảo chiều giảm",
        });
      }
      continue;
    }

    // Shooting Star / Inverted Hammer
    if (uWick >= body * 2 && lWick < body * 0.5) {
      if (i >= 3 && candles.slice(i - 3, i).every((c) => isBullish(c))) {
        patterns.push({
          type: "Shooting Star",
          direction: "bearish",
          strength: 2,
          index: i,
          description: "Shooting Star - tín hiệu đảo chiều giảm sau xu hướng tăng",
        });
      } else {
        patterns.push({
          type: "Inverted Hammer",
          direction: "bullish",
          strength: 2,
          index: i,
          description: "Inverted Hammer - khả năng đảo chiều tăng",
        });
      }
      continue;
    }

    // Bullish Engulfing
    if (
      isBearish(prev) &&
      isBullish(curr) &&
      curr.open <= prev.close &&
      curr.close >= prev.open &&
      bodySize(curr) > bodySize(prev) * 1.1
    ) {
      patterns.push({
        type: "Bullish Engulfing",
        direction: "bullish",
        strength: 3,
        index: i,
        description: "Bullish Engulfing - nến tăng nhấn chìm, tín hiệu mua mạnh",
      });
      continue;
    }

    // Bearish Engulfing
    if (
      isBullish(prev) &&
      isBearish(curr) &&
      curr.open >= prev.close &&
      curr.close <= prev.open &&
      bodySize(curr) > bodySize(prev) * 1.1
    ) {
      patterns.push({
        type: "Bearish Engulfing",
        direction: "bearish",
        strength: 3,
        index: i,
        description: "Bearish Engulfing - nến giảm nhấn chìm, tín hiệu bán mạnh",
      });
      continue;
    }

    // Piercing Line
    if (
      isBearish(prev) &&
      isBullish(curr) &&
      curr.open < prev.low &&
      curr.close > (prev.open + prev.close) / 2
    ) {
      patterns.push({
        type: "Piercing Line",
        direction: "bullish",
        strength: 2,
        index: i,
        description: "Piercing Line - nến xuyên thấu, tín hiệu tăng",
      });
      continue;
    }

    // Dark Cloud Cover
    if (
      isBullish(prev) &&
      isBearish(curr) &&
      curr.open > prev.high &&
      curr.close < (prev.open + prev.close) / 2
    ) {
      patterns.push({
        type: "Dark Cloud Cover",
        direction: "bearish",
        strength: 2,
        index: i,
        description: "Dark Cloud Cover - mây đen phủ, tín hiệu giảm",
      });
      continue;
    }

    // Morning Star (3 candles)
    if (i >= 2) {
      const prev2 = candles[i - 2];
      if (
        isBearish(prev2) &&
        bodySize(prev) / totalRange(prev) < 0.3 &&
        isBullish(curr) &&
        curr.close > (prev2.open + prev2.close) / 2
      ) {
        patterns.push({
          type: "Morning Star",
          direction: "bullish",
          strength: 3,
          index: i,
          description: "Morning Star - sao Mai, tín hiệu đảo chiều tăng mạnh",
        });
        continue;
      }

      // Evening Star
      if (
        isBullish(prev2) &&
        bodySize(prev) / totalRange(prev) < 0.3 &&
        isBearish(curr) &&
        curr.close < (prev2.open + prev2.close) / 2
      ) {
        patterns.push({
          type: "Evening Star",
          direction: "bearish",
          strength: 3,
          index: i,
          description: "Evening Star - sao Hôm, tín hiệu đảo chiều giảm mạnh",
        });
        continue;
      }
    }

    // Three White Soldiers
    if (i >= 2) {
      const prev2 = candles[i - 2];
      if (
        isBullish(prev2) &&
        isBullish(prev) &&
        isBullish(curr) &&
        prev.close > prev2.close &&
        curr.close > prev.close &&
        bodySize(prev2) > totalRange(prev2) * 0.5 &&
        bodySize(prev) > totalRange(prev) * 0.5 &&
        bodySize(curr) > totalRange(curr) * 0.5
      ) {
        patterns.push({
          type: "Three White Soldiers",
          direction: "bullish",
          strength: 3,
          index: i,
          description: "Three White Soldiers - 3 nến trắng, xu hướng tăng mạnh",
        });
        continue;
      }

      // Three Black Crows
      if (
        isBearish(prev2) &&
        isBearish(prev) &&
        isBearish(curr) &&
        prev.close < prev2.close &&
        curr.close < prev.close &&
        bodySize(prev2) > totalRange(prev2) * 0.5 &&
        bodySize(prev) > totalRange(prev) * 0.5 &&
        bodySize(curr) > totalRange(curr) * 0.5
      ) {
        patterns.push({
          type: "Three Black Crows",
          direction: "bearish",
          strength: 3,
          index: i,
          description: "Three Black Crows - 3 nến đen, xu hướng giảm mạnh",
        });
        continue;
      }
    }

    // Tweezer Top / Bottom
    if (Math.abs(curr.high - prev.high) / range < 0.02 && isBullish(prev) && isBearish(curr)) {
      patterns.push({
        type: "Tweezer Top",
        direction: "bearish",
        strength: 2,
        index: i,
        description: "Tweezer Top - đỉnh nhíp, tín hiệu đảo chiều giảm",
      });
    }
    if (Math.abs(curr.low - prev.low) / range < 0.02 && isBearish(prev) && isBullish(curr)) {
      patterns.push({
        type: "Tweezer Bottom",
        direction: "bullish",
        strength: 2,
        index: i,
        description: "Tweezer Bottom - đáy nhíp, tín hiệu đảo chiều tăng",
      });
    }
  }

  return patterns;
}

// ─── PIVOT POINTS (Classic) ───
export function calculatePivotPoints(candles: CandleData[]): PivotPoints | null {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const pp = (prev.high + prev.low + prev.close) / 3;
  return {
    pp: round(pp),
    r1: round(2 * pp - prev.low),
    r2: round(pp + (prev.high - prev.low)),
    r3: round(prev.high + 2 * (pp - prev.low)),
    s1: round(2 * pp - prev.high),
    s2: round(pp - (prev.high - prev.low)),
    s3: round(prev.low - 2 * (prev.high - pp)),
  };
}

function round(n: number): number {
  return Number(n.toPrecision(8));
}

// ─── ATR (Average True Range) ───
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  let atr = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close),
    );
    atr += tr;
  }
  return atr / period;
}

// ─── EMA ───
export function calculateEMA(candles: CandleData[], period: number): number[] {
  const prices = candles.map((c) => c.close);
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[0] = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

// ─── RSI ───
export function calculateRSI(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

// ─── MACD ───
export function calculateMACD(candles: CandleData[]) {
  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal: number[] = [];
  const k = 2 / 10;
  signal[0] = macdLine[0];
  for (let i = 1; i < macdLine.length; i++) {
    signal[i] = macdLine[i] * k + signal[i - 1] * (1 - k);
  }
  const last = macdLine.length - 1;
  return {
    macd: macdLine[last],
    signal: signal[last],
    histogram: macdLine[last] - signal[last],
    crossover: last > 0 && macdLine[last] > signal[last] && macdLine[last - 1] <= signal[last - 1],
    crossunder: last > 0 && macdLine[last] < signal[last] && macdLine[last - 1] >= signal[last - 1],
  };
}

// ─── SUPPORT/RESISTANCE DETECTION ───
export function detectSRLevels(
  candles: CandleData[],
  currentPrice: number,
  atr: number,
  patterns: CandlePattern[],
): SRLevel[] {
  if (candles.length < 10 || atr === 0) return [];

  const levels: { price: number; count: number; type: "high" | "low" }[] = [];
  const tolerance = atr * 0.3;

  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    const isSwingHigh =
      c.high > candles[i - 1].high &&
      c.high > candles[i - 2].high &&
      c.high > candles[i + 1].high &&
      c.high > candles[i + 2].high;
    const isSwingLow =
      c.low < candles[i - 1].low &&
      c.low < candles[i - 2].low &&
      c.low < candles[i + 1].low &&
      c.low < candles[i + 2].low;

    if (isSwingHigh) {
      const existing = levels.find((l) => Math.abs(l.price - c.high) < tolerance && l.type === "high");
      if (existing) {
        existing.count++;
        existing.price = (existing.price + c.high) / 2;
      } else {
        levels.push({ price: c.high, count: 1, type: "high" });
      }
    }
    if (isSwingLow) {
      const existing = levels.find((l) => Math.abs(l.price - c.low) < tolerance && l.type === "low");
      if (existing) {
        existing.count++;
        existing.price = (existing.price + c.low) / 2;
      } else {
        levels.push({ price: c.low, count: 1, type: "low" });
      }
    }
  }

  const recentPatterns = patterns.slice(-5);
  const lastPatternBearish = recentPatterns.find((p) => p.direction === "bearish");
  const lastPatternBullish = recentPatterns.find((p) => p.direction === "bullish");

  const srLevels: SRLevel[] = levels
    .filter((l) => Math.abs(l.price - currentPrice) < atr * 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((l, idx) => {
      const isResistance = l.price > currentPrice;
      const distance = Math.abs(l.price - currentPrice);
      const distATR = distance / atr;
      const confidence = Math.min(98, 60 + l.count * 8 + (distATR < 1 ? 15 : distATR < 2 ? 8 : 0));
      const strength: SRLevel["strength"] =
        l.count >= 4 ? "Rất mạnh" : l.count >= 2 ? "Mạnh" : "Trung bình";

      const sl = isResistance ? l.price + atr * 0.5 : l.price - atr * 0.5;
      const slPct = ((Math.abs(sl - l.price) / l.price) * 100).toFixed(1);
      const tp1 = isResistance ? l.price - atr * 0.8 : l.price + atr * 0.8;
      const tp2 = isResistance ? l.price - atr * 1.6 : l.price + atr * 1.6;
      const risk = Math.abs(sl - currentPrice);
      const reward = Math.abs(tp1 - currentPrice);
      const rr = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : "1:1";

      const patternMatch = isResistance
        ? lastPatternBearish?.type || "Bearish Engulfing"
        : lastPatternBullish?.type || "Bullish Engulfing";

      return {
        id: `sr-${idx}`,
        type: isResistance ? "resistance" : "support",
        price: Number(l.price.toPrecision(8)),
        strength,
        confidence: Math.round(confidence),
        testCount: l.count,
        riskReward: rr,
        pattern: patternMatch,
        action: isResistance ? "Quan sát breakout hoặc rejection" : "Quan sát bounce hoặc breakdown",
        scalpEntry: Number(currentPrice.toPrecision(8)),
        scalpTP: Number(tp1.toPrecision(8)),
        swingTP: Number(tp2.toPrecision(8)),
        stopLoss: Number(sl.toPrecision(8)),
        slPercent: `${isResistance ? "+" : "-"}${slPct}%`,
        isAuto: true,
      };
    });

  return srLevels.sort((a, b) => b.price - a.price);
}

// ─── ENTRY SIGNAL GENERATION ───
export function generateEntrySignal(
  candles: CandleData[],
  pivot: PivotPoints | null,
  patterns: CandlePattern[],
  srLevels: SRLevel[],
  rsi: number,
  macd: ReturnType<typeof calculateMACD>,
  atr: number,
): EntrySignal {
  if (candles.length < 5 || !pivot) {
    return {
      type: "Neutral",
      reason: "Không đủ dữ liệu",
      confidence: 0,
      entry: 0,
      tp1: 0,
      tp2: 0,
      sl: 0,
      rr: "—",
    };
  }

  const curr = candles[candles.length - 1];
  const price = curr.close;

  let bullScore = 0;
  let bearScore = 0;
  const reasons: string[] = [];

  // Pivot analysis
  if (price > pivot.pp) {
    bullScore += 2;
    reasons.push("Giá trên Pivot");
  } else {
    bearScore += 2;
    reasons.push("Giá dưới Pivot");
  }
  if (price > pivot.r1) bullScore += 1;
  if (price < pivot.s1) bearScore += 1;

  // RSI
  if (rsi > 70) {
    bearScore += 2;
    reasons.push(`RSI quá mua (${rsi.toFixed(1)})`);
  } else if (rsi < 30) {
    bullScore += 2;
    reasons.push(`RSI quá bán (${rsi.toFixed(1)})`);
  } else if (rsi > 55) {
    bullScore += 1;
  } else if (rsi < 45) {
    bearScore += 1;
  }

  // MACD
  if (macd.crossover) {
    bullScore += 3;
    reasons.push("MACD bullish crossover");
  } else if (macd.crossunder) {
    bearScore += 3;
    reasons.push("MACD bearish crossunder");
  } else if (macd.histogram > 0) {
    bullScore += 1;
  } else {
    bearScore += 1;
  }

  // Recent patterns
  const recent = patterns.filter((p) => p.index >= candles.length - 5);
  for (const p of recent) {
    if (p.direction === "bullish") {
      bullScore += p.strength;
      reasons.push(p.type);
    } else if (p.direction === "bearish") {
      bearScore += p.strength;
      reasons.push(p.type);
    }
  }

  // Near S/R
  const nearResistance = srLevels.find(
    (l) => l.type === "resistance" && Math.abs(l.price - price) < atr * 0.8,
  );
  const nearSupport = srLevels.find(
    (l) => l.type === "support" && Math.abs(l.price - price) < atr * 0.8,
  );
  if (nearResistance) {
    bearScore += 2;
    reasons.push("Gần kháng cự");
  }
  if (nearSupport) {
    bullScore += 2;
    reasons.push("Gần hỗ trợ");
  }

  const total = bullScore + bearScore || 1;
  const bullPct = Math.round((bullScore / total) * 100);

  if (bullScore > bearScore + 2) {
    const entry = price;
    const sl = nearSupport ? nearSupport.price - atr * 0.3 : price - atr * 1.2;
    const tp1 = nearResistance ? nearResistance.price : price + atr * 1.5;
    const tp2 = pivot.r2 > price ? pivot.r2 : price + atr * 2.5;
    const risk = Math.abs(entry - sl);
    return {
      type: "Long",
      reason: reasons.join(" · "),
      confidence: bullPct,
      entry: Number(entry.toPrecision(8)),
      tp1: Number(tp1.toPrecision(8)),
      tp2: Number(tp2.toPrecision(8)),
      sl: Number(sl.toPrecision(8)),
      rr: risk > 0 ? `1:${((tp1 - entry) / risk).toFixed(1)}` : "—",
    };
  } else if (bearScore > bullScore + 2) {
    const entry = price;
    const sl = nearResistance ? nearResistance.price + atr * 0.3 : price + atr * 1.2;
    const tp1 = nearSupport ? nearSupport.price : price - atr * 1.5;
    const tp2 = pivot.s2 < price ? pivot.s2 : price - atr * 2.5;
    const risk = Math.abs(sl - entry);
    return {
      type: "Short",
      reason: reasons.join(" · "),
      confidence: 100 - bullPct,
      entry: Number(entry.toPrecision(8)),
      tp1: Number(tp1.toPrecision(8)),
      tp2: Number(tp2.toPrecision(8)),
      sl: Number(sl.toPrecision(8)),
      rr: risk > 0 ? `1:${(Math.abs(entry - tp1) / risk).toFixed(1)}` : "—",
    };
  }

  return {
    type: "Neutral",
    reason: reasons.join(" · ") || "Chưa rõ xu hướng",
    confidence: 50,
    entry: price,
    tp1: price + atr,
    tp2: price + atr * 2,
    sl: price - atr,
    rr: "1:1",
  };
}

// ─── Sentiment from Binance data ───
export function calculateSentiment(candles: CandleData[]): { bullish: number; bearish: number } {
  if (candles.length < 10) return { bullish: 50, bearish: 50 };

  const recent = candles.slice(-20);
  let bullVol = 0;
  let bearVol = 0;
  for (const c of recent) {
    if (c.close >= c.open) bullVol += c.volume;
    else bearVol += c.volume;
  }
  const total = bullVol + bearVol || 1;
  const bull = Math.round((bullVol / total) * 100);
  return { bullish: bull, bearish: 100 - bull };
}

// ─── TREND LINE DETECTION ───
export function detectTrendLines(candles: CandleData[]): TrendLine[] {
  if (candles.length < 15) return [];
  const lines: TrendLine[] = [];

  const swingHighs: { idx: number; price: number }[] = [];
  const swingLows: { idx: number; price: number }[] = [];

  for (let i = 3; i < candles.length - 3; i++) {
    const c = candles[i];
    if (
      c.high > candles[i - 1].high && c.high > candles[i - 2].high && c.high > candles[i - 3].high &&
      c.high > candles[i + 1].high && c.high > candles[i + 2].high
    ) {
      swingHighs.push({ idx: i, price: c.high });
    }
    if (
      c.low < candles[i - 1].low && c.low < candles[i - 2].low && c.low < candles[i - 3].low &&
      c.low < candles[i + 1].low && c.low < candles[i + 2].low
    ) {
      swingLows.push({ idx: i, price: c.low });
    }
  }

  const buildLine = (
    points: { idx: number; price: number }[],
    type: "resistance" | "support",
  ): TrendLine | null => {
    if (points.length < 2) return null;
    let bestLine: TrendLine | null = null;
    let bestTouches = 0;

    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        if (Math.abs(p2.idx - p1.idx) < 5) continue;

        const slope = (p2.price - p1.price) / (p2.idx - p1.idx);
        let touches = 2;

        for (let k = 0; k < points.length; k++) {
          if (k === i || k === j) continue;
          const expected = p1.price + slope * (points[k].idx - p1.idx);
          const tolerance = Math.abs(p2.price - p1.price) * 0.08 + candles[0].close * 0.001;
          if (Math.abs(points[k].price - expected) < tolerance) touches++;
        }

        if (touches > bestTouches) {
          bestTouches = touches;
          bestLine = {
            id: `tl-${type}-${i}-${j}`,
            type,
            startIndex: p1.idx,
            endIndex: Math.min(candles.length - 1, p2.idx + Math.floor((p2.idx - p1.idx) * 0.3)),
            startPrice: p1.price,
            endPrice: p1.price + slope * (Math.min(candles.length - 1, p2.idx + Math.floor((p2.idx - p1.idx) * 0.3)) - p1.idx),
            slope,
            touches,
            strength: Math.min(100, touches * 25),
          };
        }
      }
    }
    return bestLine;
  };

  const rLine = buildLine(swingHighs, "resistance");
  const sLine = buildLine(swingLows, "support");
  if (rLine) lines.push(rLine);
  if (sLine) lines.push(sLine);

  if (swingHighs.length >= 3) {
    const sorted = [...swingHighs].sort((a, b) => b.price - a.price);
    const top2 = sorted.slice(0, 2);
    if (top2.length === 2 && Math.abs(top2[0].idx - top2[1].idx) >= 5) {
      const [p1, p2] = top2[0].idx < top2[1].idx ? [top2[0], top2[1]] : [top2[1], top2[0]];
      const slope = (p2.price - p1.price) / (p2.idx - p1.idx);
      const endIdx = Math.min(candles.length - 1, p2.idx + 10);
      lines.push({
        id: "tl-major-res",
        type: "resistance",
        startIndex: p1.idx,
        endIndex: endIdx,
        startPrice: p1.price,
        endPrice: p1.price + slope * (endIdx - p1.idx),
        slope,
        touches: 2,
        strength: 60,
      });
    }
  }

  if (swingLows.length >= 3) {
    const sorted = [...swingLows].sort((a, b) => a.price - b.price);
    const bot2 = sorted.slice(0, 2);
    if (bot2.length === 2 && Math.abs(bot2[0].idx - bot2[1].idx) >= 5) {
      const [p1, p2] = bot2[0].idx < bot2[1].idx ? [bot2[0], bot2[1]] : [bot2[1], bot2[0]];
      const slope = (p2.price - p1.price) / (p2.idx - p1.idx);
      const endIdx = Math.min(candles.length - 1, p2.idx + 10);
      lines.push({
        id: "tl-major-sup",
        type: "support",
        startIndex: p1.idx,
        endIndex: endIdx,
        startPrice: p1.price,
        endPrice: p1.price + slope * (endIdx - p1.idx),
        slope,
        touches: 2,
        strength: 60,
      });
    }
  }

  return lines;
}

// ─── ENTRY MARKERS ON CHART ───
export function generateEntryMarkers(
  candles: CandleData[],
  signal: EntrySignal,
): EntryMarker[] {
  if (signal.type === "Neutral" || candles.length < 5) return [];
  const lastIdx = candles.length - 1;
  const dir = signal.type === "Long" ? "long" : "short";
  const markers: EntryMarker[] = [
    { index: lastIdx, price: signal.entry, type: "entry", direction: dir, label: `Entry ${signal.type}` },
    { index: lastIdx, price: signal.sl, type: "sl", direction: dir, label: "Stop Loss" },
    { index: lastIdx, price: signal.tp1, type: "tp1", direction: dir, label: "TP1" },
    { index: lastIdx, price: signal.tp2, type: "tp2", direction: dir, label: "TP2" },
  ];
  return markers;
}

// ─── AI SCORING ENGINE ───
export function runAIAnalysis(
  candles: CandleData[],
  pivot: PivotPoints | null,
  patterns: CandlePattern[],
  srLevels: SRLevel[],
  rsi: number,
  macd: ReturnType<typeof calculateMACD>,
  atr: number,
  sentiment: { bullish: number; bearish: number },
): AIAnalysisScore {
  if (candles.length < 20 || !pivot) {
    return { overall: 50, trendScore: 50, momentumScore: 50, volumeScore: 50, patternScore: 50, srScore: 50, volatilityScore: 50, verdict: "Chưa đủ dữ liệu", details: [] };
  }

  const details: string[] = [];
  const price = candles[candles.length - 1].close;

  // 1. Trend score (EMA20 vs EMA50, price vs pivot)
  const ema20 = calculateEMA(candles, 20);
  const ema50 = calculateEMA(candles, 50);
  const last20 = ema20[ema20.length - 1];
  const last50 = ema50[ema50.length - 1];
  let trendScore = 50;
  if (last20 > last50) { trendScore += 20; details.push("EMA20 > EMA50: xu hướng tăng"); }
  else { trendScore -= 20; details.push("EMA20 < EMA50: xu hướng giảm"); }
  if (price > pivot.pp) { trendScore += 15; details.push("Giá trên Pivot Point"); }
  else { trendScore -= 15; details.push("Giá dưới Pivot Point"); }
  const recentCandles = candles.slice(-5);
  const upCount = recentCandles.filter(c => c.close > c.open).length;
  if (upCount >= 4) { trendScore += 10; details.push("4/5 nến gần nhất tăng"); }
  else if (upCount <= 1) { trendScore -= 10; details.push("4/5 nến gần nhất giảm"); }
  trendScore = Math.max(0, Math.min(100, trendScore));

  // 2. Momentum score (RSI, MACD)
  let momentumScore = 50;
  if (rsi > 70) { momentumScore -= 25; details.push(`RSI ${rsi.toFixed(0)}: quá mua, momentum giảm`); }
  else if (rsi > 55) { momentumScore += 15; details.push(`RSI ${rsi.toFixed(0)}: momentum tích cực`); }
  else if (rsi < 30) { momentumScore += 25; details.push(`RSI ${rsi.toFixed(0)}: quá bán, cơ hội mua`); }
  else if (rsi < 45) { momentumScore -= 15; details.push(`RSI ${rsi.toFixed(0)}: momentum yếu`); }
  if (macd.crossover) { momentumScore += 20; details.push("MACD bullish crossover"); }
  else if (macd.crossunder) { momentumScore -= 20; details.push("MACD bearish crossunder"); }
  else if (macd.histogram > 0) { momentumScore += 8; }
  else { momentumScore -= 8; }
  momentumScore = Math.max(0, Math.min(100, momentumScore));

  // 3. Volume score
  let volumeScore = 50;
  const avgVol = candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
  const recentVol = candles.slice(-3).reduce((s, c) => s + c.volume, 0) / 3;
  const volRatio = recentVol / (avgVol || 1);
  if (volRatio > 1.5) { volumeScore += 25; details.push(`Volume tăng ${(volRatio * 100 - 100).toFixed(0)}% so với TB`); }
  else if (volRatio > 1.1) { volumeScore += 10; }
  else if (volRatio < 0.6) { volumeScore -= 20; details.push("Volume thấp, thiếu xác nhận"); }
  if (sentiment.bullish > 65) { volumeScore += 10; details.push(`${sentiment.bullish}% volume mua`); }
  else if (sentiment.bearish > 65) { volumeScore -= 10; details.push(`${sentiment.bearish}% volume bán`); }
  volumeScore = Math.max(0, Math.min(100, volumeScore));

  // 4. Pattern score
  let patternScore = 50;
  const recentPatterns = patterns.filter(p => p.index >= candles.length - 5);
  for (const p of recentPatterns) {
    if (p.direction === "bullish") patternScore += p.strength * 8;
    else if (p.direction === "bearish") patternScore -= p.strength * 8;
  }
  if (recentPatterns.length > 0) {
    const strongest = recentPatterns.sort((a, b) => b.strength - a.strength)[0];
    details.push(`Mô hình: ${strongest.type} (${strongest.direction === "bullish" ? "tăng" : strongest.direction === "bearish" ? "giảm" : "trung tính"})`);
  }
  patternScore = Math.max(0, Math.min(100, patternScore));

  // 5. S/R score
  let srScore = 50;
  const nearR = srLevels.find(l => l.type === "resistance" && l.price > price && (l.price - price) / price < 0.02);
  const nearS = srLevels.find(l => l.type === "support" && l.price < price && (price - l.price) / price < 0.02);
  if (nearR) {
    srScore -= nearR.confidence * 0.3;
    details.push(`Gần kháng cự $${nearR.price.toFixed(0)} (${nearR.confidence}% tin cậy)`);
  }
  if (nearS) {
    srScore += nearS.confidence * 0.3;
    details.push(`Gần hỗ trợ $${nearS.price.toFixed(0)} (${nearS.confidence}% tin cậy)`);
  }
  const strongR = srLevels.filter(l => l.type === "resistance" && l.strength === "Rất mạnh").length;
  const strongS = srLevels.filter(l => l.type === "support" && l.strength === "Rất mạnh").length;
  if (strongS > strongR) { srScore += 10; }
  else if (strongR > strongS) { srScore -= 10; }
  srScore = Math.max(0, Math.min(100, srScore));

  // 6. Volatility score
  let volatilityScore = 50;
  const atrPct = (atr / price) * 100;
  if (atrPct > 3) { volatilityScore += 15; details.push(`Biến động cao (ATR ${atrPct.toFixed(1)}%)`); }
  else if (atrPct > 1.5) { volatilityScore += 5; }
  else { volatilityScore -= 10; details.push(`Biến động thấp (ATR ${atrPct.toFixed(1)}%)`); }
  volatilityScore = Math.max(0, Math.min(100, volatilityScore));

  // Weighted overall
  const weights = { trend: 0.25, momentum: 0.20, volume: 0.15, pattern: 0.15, sr: 0.15, volatility: 0.10 };
  const overall = Math.round(
    trendScore * weights.trend +
    momentumScore * weights.momentum +
    volumeScore * weights.volume +
    patternScore * weights.pattern +
    srScore * weights.sr +
    volatilityScore * weights.volatility
  );

  let verdict: string;
  if (overall >= 70) verdict = "AI khuyến nghị LONG mạnh";
  else if (overall >= 60) verdict = "AI thiên hướng LONG";
  else if (overall <= 30) verdict = "AI khuyến nghị SHORT mạnh";
  else if (overall <= 40) verdict = "AI thiên hướng SHORT";
  else verdict = "AI đang trung lập, chờ tín hiệu rõ hơn";

  return {
    overall,
    trendScore: Math.round(trendScore),
    momentumScore: Math.round(momentumScore),
    volumeScore: Math.round(volumeScore),
    patternScore: Math.round(patternScore),
    srScore: Math.round(srScore),
    volatilityScore: Math.round(volatilityScore),
    verdict,
    details,
  };
}
