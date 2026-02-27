import type { Candle } from "@/lib/marketData/types";
import { atr } from "./atr";
import { findSwingHighs, findSwingLows } from "./swings";

export interface SRLevel {
  type: "resistance" | "support";
  price: number;
  touches: number;
  lastTouchTs: number;
}

function groupLevels(points: { price: number; ts: number }[], tolerance: number) {
  const groups: { price: number; touches: number; lastTouchTs: number }[] = [];
  for (const p of points) {
    const g = groups.find((x) => Math.abs(x.price - p.price) <= tolerance);
    if (!g) {
      groups.push({ price: p.price, touches: 1, lastTouchTs: p.ts });
    } else {
      // update group center as running average
      g.price = (g.price * g.touches + p.price) / (g.touches + 1);
      g.touches += 1;
      g.lastTouchTs = Math.max(g.lastTouchTs, p.ts);
    }
  }
  return groups;
}

export function computeHardSupportResistance(args: {
  candles: Candle[];
  swingWindow?: number;
  minTouches?: number;
}): { levels: SRLevel[]; atrValue: number } {
  const candles = args.candles;
  if (candles.length < 30) return { levels: [], atrValue: 0 };

  const swingWindow = args.swingWindow ?? 3;
  const minTouches = args.minTouches ?? 3;
  const atrSeries = atr(candles, 14);
  const atrValue = atrSeries[atrSeries.length - 1];
  const tol = Number.isFinite(atrValue) ? atrValue * 0.25 : (candles[candles.length - 1].close || 0) * 0.002;

  const swingHighs = findSwingHighs(candles, swingWindow).map((p) => ({ price: p.price, ts: p.ts }));
  const swingLows = findSwingLows(candles, swingWindow).map((p) => ({ price: p.price, ts: p.ts }));

  const groupedHighs = groupLevels(swingHighs, tol).filter((g) => g.touches >= minTouches);
  const groupedLows = groupLevels(swingLows, tol).filter((g) => g.touches >= minTouches);

  const levels: SRLevel[] = [
    ...groupedHighs.map((g) => ({ type: "resistance" as const, price: g.price, touches: g.touches, lastTouchTs: g.lastTouchTs })),
    ...groupedLows.map((g) => ({ type: "support" as const, price: g.price, touches: g.touches, lastTouchTs: g.lastTouchTs })),
  ];

  levels.sort((a, b) => b.touches - a.touches || b.lastTouchTs - a.lastTouchTs);
  return { levels, atrValue: Number.isFinite(atrValue) ? atrValue : 0 };
}

