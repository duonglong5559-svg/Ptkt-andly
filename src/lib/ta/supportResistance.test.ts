import { describe, expect, it } from "vitest";
import type { Candle } from "@/lib/marketData/types";
import { computeHardSupportResistance } from "./supportResistance";

function makeCandle(ts: number, o: number, h: number, l: number, c: number): Candle {
  return { ts, time: "t", open: o, high: h, low: l, close: c, volume: 0 };
}

describe("computeHardSupportResistance", () => {
  it("returns grouped hard levels when enough touches exist", () => {
    const candles: Candle[] = [];
    let ts = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 50; i++) {
      // baseline
      let high = 102;
      let low = 98;
      if ([10, 20, 30, 40].includes(i)) {
        high = 110; // swing high
      }
      if ([15, 25, 35, 45].includes(i)) {
        low = 90; // swing low
      }

      // ensure neighbors are not higher/lower than pivots
      const open = 100;
      const close = 100 + (i % 2 === 0 ? 0.5 : -0.5);
      candles.push(makeCandle(ts, open, high, low, close));
      ts += 60 * 60 * 1000;
    }

    const { levels } = computeHardSupportResistance({ candles, swingWindow: 1, minTouches: 3 });
    const res = levels.find((l) => l.type === "resistance");
    const sup = levels.find((l) => l.type === "support");
    expect(res?.touches).toBeGreaterThanOrEqual(3);
    expect(sup?.touches).toBeGreaterThanOrEqual(3);
    expect(res?.price).toBeGreaterThan(sup?.price ?? 0);
  });
});

