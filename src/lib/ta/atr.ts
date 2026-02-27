import type { Candle } from "@/lib/marketData/types";

export function trueRange(curr: Candle, prev?: Candle): number {
  if (!prev) return curr.high - curr.low;
  const hl = curr.high - curr.low;
  const hc = Math.abs(curr.high - prev.close);
  const lc = Math.abs(curr.low - prev.close);
  return Math.max(hl, hc, lc);
}

export function atr(candles: Candle[], period: number): number[] {
  if (period <= 0) return [];
  const trs: number[] = candles.map((c, i) => trueRange(c, i > 0 ? candles[i - 1] : undefined));
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < trs.length; i++) {
    const v = trs[i];
    sum += v;
    if (i >= period) sum -= trs[i - period];
    if (i < period - 1) {
      out.push(Number.NaN);
    } else {
      out.push(sum / period);
    }
  }
  return out;
}

