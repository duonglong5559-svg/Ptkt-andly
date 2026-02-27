import { describe, expect, it } from "vitest";
import {
  CandleData,
  generateCandleData,
  getResistanceLevels,
  getTechnicalSnapshot,
  tradingPairs,
} from "./tradingData";

describe("tradingData calculations", () => {
  it("generates deterministic candles and anchors the last close to current price", () => {
    const pair = tradingPairs.find((item) => item.symbol === "XAUUSD") ?? tradingPairs[0];
    const firstRun = generateCandleData(pair, "4H", 60);
    const secondRun = generateCandleData(pair, "4H", 60);

    expect(firstRun).toHaveLength(60);
    expect(secondRun).toHaveLength(60);
    expect(firstRun.map((candle) => candle.close)).toEqual(secondRun.map((candle) => candle.close));
    expect(firstRun[firstRun.length - 1].close).toBe(pair.currentPrice);
  });

  it("calculates pivot levels from previous completed candle", () => {
    const pair = tradingPairs[0];
    const candles: CandleData[] = [
      { time: "1/1 00:00", open: 100, high: 105, low: 98, close: 102, volume: 1000 },
      { time: "1/1 04:00", open: 102, high: 107, low: 100, close: 106, volume: 1200 },
      { time: "1/1 08:00", open: 106, high: 108, low: 103, close: 104, volume: 1300 },
      { time: "1/1 12:00", open: 104, high: 109, low: 102, close: 108, volume: 1400 },
    ];

    const snapshot = getTechnicalSnapshot(pair, candles);
    const previous = candles[candles.length - 2];
    const pivot = (previous.high + previous.low + previous.close) / 3;
    const r1 = 2 * pivot - previous.low;
    const s1 = 2 * pivot - previous.high;

    expect(snapshot.pivotPoint).toBeCloseTo(Number(pivot.toFixed(2)), 2);
    expect(snapshot.r1).toBeCloseTo(Number(r1.toFixed(2)), 2);
    expect(snapshot.s1).toBeCloseTo(Number(s1.toFixed(2)), 2);
  });

  it("returns only high-probability support/resistance levels", () => {
    const pair = tradingPairs[0];
    const candles = generateCandleData(pair, "4H", 110);
    const snapshot = {
      ...getTechnicalSnapshot(pair, candles),
      highProbabilityScore: 88,
      qualifiesForAnalysis: true,
      atr: pair.currentPrice * 0.0045,
    };

    const levels = getResistanceLevels(pair, candles, snapshot);

    expect(levels.length).toBeGreaterThan(0);
    levels.forEach((level) => {
      expect(level.highProbability).toBe(true);
      expect(level.confidence).toBeGreaterThanOrEqual(82);
      expect(level.riskRewardRatio).toBeGreaterThanOrEqual(1.7);
    });
  });
});
