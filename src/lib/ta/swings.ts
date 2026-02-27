import type { Candle } from "@/lib/marketData/types";

export interface SwingPoint {
  idx: number;
  ts: number;
  price: number;
  kind: "high" | "low";
}

export function findSwingHighs(candles: Candle[], leftRight: number): SwingPoint[] {
  const out: SwingPoint[] = [];
  for (let i = leftRight; i < candles.length - leftRight; i++) {
    const pivot = candles[i].high;
    let ok = true;
    for (let j = i - leftRight; j <= i + leftRight; j++) {
      if (j === i) continue;
      if (candles[j].high >= pivot) {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ idx: i, ts: candles[i].ts, price: pivot, kind: "high" });
  }
  return out;
}

export function findSwingLows(candles: Candle[], leftRight: number): SwingPoint[] {
  const out: SwingPoint[] = [];
  for (let i = leftRight; i < candles.length - leftRight; i++) {
    const pivot = candles[i].low;
    let ok = true;
    for (let j = i - leftRight; j <= i + leftRight; j++) {
      if (j === i) continue;
      if (candles[j].low <= pivot) {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ idx: i, ts: candles[i].ts, price: pivot, kind: "low" });
  }
  return out;
}

