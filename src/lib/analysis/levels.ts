import type { Candle } from "@/lib/marketData/types";
import type { ResistanceLevel } from "@/data/tradingData";
import { computeHardSupportResistance } from "@/lib/ta/supportResistance";
import { computeTechnicalContext } from "./context";

function formatRR(rr: number) {
  if (!Number.isFinite(rr)) return "—";
  return `1:${rr.toFixed(1)}`;
}

function detectPattern(candles: Candle[]): string {
  const a = candles[candles.length - 2];
  const b = candles[candles.length - 1];
  if (!a || !b) return "—";

  const aBull = a.close > a.open;
  const bBull = b.close > b.open;
  const aBody = Math.abs(a.close - a.open);
  const bBody = Math.abs(b.close - b.open);

  const bEngulfs =
    bBody > aBody * 1.1 &&
    ((bBull && !aBull && b.open < a.close && b.close > a.open) ||
      (!bBull && aBull && b.open > a.close && b.close < a.open));
  if (bEngulfs) return bBull ? "Bullish Engulfing" : "Bearish Engulfing";

  const range = b.high - b.low;
  const lowerWick = Math.min(b.open, b.close) - b.low;
  if (range > 0 && lowerWick / range > 0.55 && bBody / range < 0.3) return "Hammer";

  return "—";
}

export function computeHardLevelsForUI(args: {
  candles: Candle[];
  currentPrice: number;
}): { levels: ResistanceLevel[]; meta: { trend: string; warning?: string } } {
  const { candles, currentPrice } = args;
  const { pivot, trend } = computeTechnicalContext(candles);
  const { levels: sr, atrValue } = computeHardSupportResistance({ candles, minTouches: 3, swingWindow: 3 });
  const tol = Math.max(atrValue * 0.25, currentPrice * 0.0015);

  // Keep only "hard" levels: close enough to current context and with good touch count
  const hard = sr
    .filter((l) => l.touches >= 3)
    .filter((l) => Math.abs(l.price - currentPrice) <= currentPrice * 0.08); // within 8%

  const sortedByPrice = [...hard].sort((a, b) => a.price - b.price);
  const nearestSupport = [...sortedByPrice].filter((l) => l.type === "support" && l.price < currentPrice).pop();
  const nearestResistance = sortedByPrice.find((l) => l.type === "resistance" && l.price > currentPrice);

  const pattern = detectPattern(candles);

  const uiLevels: ResistanceLevel[] = hard
    .map((l, idx) => {
      const isRes = l.type === "resistance";
      const entry = l.price;
      const stopLoss = isRes ? entry + Math.max(atrValue, tol) : entry - Math.max(atrValue, tol);

      const target =
        isRes
          ? nearestSupport?.price ?? pivot?.s1 ?? currentPrice * 0.99
          : nearestResistance?.price ?? pivot?.r1 ?? currentPrice * 1.01;

      const rr = Math.abs(target - entry) / Math.max(1e-9, Math.abs(entry - stopLoss));
      const strength =
        l.touches >= 5 ? ("Rất mạnh" as const) : l.touches >= 4 ? ("Mạnh" as const) : ("Trung bình" as const);

      const pivotBonus =
        pivot && [pivot.pp, pivot.r1, pivot.s1, pivot.r2, pivot.s2].some((p) => Math.abs(p - entry) <= tol) ? 12 : 0;
      const trendBonus = (trend === "up" && !isRes) || (trend === "down" && isRes) ? 10 : 0;
      const rrBonus = rr >= 2 ? 10 : rr >= 1.6 ? 5 : 0;
      const confidence = Math.min(99, Math.round(l.touches * 15 + pivotBonus + trendBonus + rrBonus));

      const action =
        confidence >= 85 && rr >= 1.8
          ? "Chỉ chờ xác nhận (rejection/breakout) rồi mới vào kèo"
          : "Quan sát thêm, chưa đủ chuẩn kèo tỉ lệ cao";

      return {
        id: `${l.type}-${idx}`,
        type: l.type,
        price: Number(entry.toFixed(2)),
        label: isRes ? "KHÁNG CỰ" : "HỖ TRỢ",
        strength,
        confidence,
        testCount: l.touches,
        riskReward: formatRR(rr),
        rr,
        scalpPrice: Number((entry + (isRes ? -1 : 1) * Math.max(tol, atrValue) * 0.35).toFixed(2)),
        swingPrice: Number(target.toFixed(2)),
        stopLoss: Number(stopLoss.toFixed(2)),
        stopLossChange: isRes ? "+ATR" : "-ATR",
        pattern,
        action,
        isAuto: true,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const warning =
    uiLevels.length === 0 ? "Chưa đủ dữ liệu để xác định hỗ trợ/kháng cự cứng (hard SR) đúng chuẩn." : undefined;
  return { levels: uiLevels, meta: { trend, warning } };
}

