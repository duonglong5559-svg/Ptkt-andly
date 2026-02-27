/**
 * Công thức Pivot Point chuẩn Forex
 * P = (H + L + C) / 3
 * R1 = 2*P - L | R2 = P + (H - L) | R3 = H + 2*(P - L)
 * S1 = 2*P - H | S2 = P - (H - L) | S3 = L - 2*(H - P)
 */

export interface CandleOHLC {
  high: number;
  low: number;
  close: number;
  open?: number;
}

export interface StandardPivotLevels {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

/** Tính Pivot Point chuẩn từ nến trước (H, L, C) */
export function calculateStandardPivot(prevCandle: CandleOHLC): StandardPivotLevels {
  const { high: H, low: L, close: C } = prevCandle;
  const pivot = (H + L + C) / 3;

  return {
    pivot,
    r1: 2 * pivot - L,
    r2: pivot + (H - L),
    r3: H + 2 * (pivot - L),
    s1: 2 * pivot - H,
    s2: pivot - (H - L),
    s3: L - 2 * (H - pivot),
  };
}

/** Lấy nến trước (H, L, C) từ mảng candles để tính pivot */
export function getPreviousCandleForPivot(candles: Array<{ high: number; low: number; close: number }>): CandleOHLC | null {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  return { high: prev.high, low: prev.low, close: prev.close };
}
