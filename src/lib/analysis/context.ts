import type { Candle } from "@/lib/marketData/types";
import { ema } from "@/lib/ta/ema";
import { pivotPointsClassic, type PivotPointsClassic } from "@/lib/ta/pivots";

export type TrendRegime = "up" | "down" | "sideways";

export interface TechnicalContext {
  pivot?: PivotPointsClassic;
  trend: TrendRegime;
}

export function computeTechnicalContext(candles: Candle[]): TechnicalContext {
  const trend = computeTrendRegime(candles);

  const prev = candles[candles.length - 2];
  if (!prev) return { trend };
  const pivot = pivotPointsClassic(prev.high, prev.low, prev.close);
  return { pivot, trend };
}

function computeTrendRegime(candles: Candle[]): TrendRegime {
  if (candles.length < 60) return "sideways";
  const closes = candles.map((c) => c.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const i = closes.length - 1;
  const a20 = ema20[i];
  const a50 = ema50[i];
  const s20 = ema20[i] - ema20[Math.max(0, i - 5)];
  const s50 = ema50[i] - ema50[Math.max(0, i - 5)];

  if (a20 > a50 && s20 > 0 && s50 > 0) return "up";
  if (a20 < a50 && s20 < 0 && s50 < 0) return "down";
  return "sideways";
}

