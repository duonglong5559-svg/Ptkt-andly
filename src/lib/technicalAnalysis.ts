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
